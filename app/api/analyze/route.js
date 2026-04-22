import { buildRagContext } from "../../../backend/lib/rag";
import { storeAnalysisRecord } from "../../../backend/lib/analysis-db";
export const runtime = "nodejs";
const ANTHROPIC_MODEL = "claude-3-5-sonnet-latest";
const GEMINI_MODEL = "gemini-1.5-flash";
function clamp(value, min, max) {
return Math.max(min, Math.min(max, value));
}
function findRiskClauses(text) {
const lines = text
    .split(/[\n.]/)
    .map((line) => line.trim())
    .filter(Boolean);

const riskyWords = ["forfeit","penalty","termination",
    "arbitration","non-compete","deduct",
    "withhold","sole discretion","lock-in","liable",];

const matches = lines.filter((line) =>
    riskyWords.some((word) => line.toLowerCase().includes(word))
);

const selected = matches.slice(0, 4);
  if(selected.length > 0){
    return selected;
  }

  return lines.slice(0, Math.min(lines.length,3));
}

function buildMock(documentText) {
  const clauses = findRiskClauses(documentText);
  const riskScore = clamp(4+clauses.length *1.3,1,10);

  return {
    riskScore: Number(riskScore.toFixed(1)),
    recommendation: riskScore >= 7 ? "Negotiate" : riskScore >= 5 ? "Review Carefully" : "Proceed with Caution",
    summaryEn:
      "This document contains clauses that can create financial or legal disadvantage if signed without edits.",
    summaryHi:
      "इस दस्तावेज़ में कुछ ऐसी शर्तें हैं जो बिना बदलाव के साइन करने पर नुकसान कर सकती हैं।",
    actions: ["Ask for written changes to one-sided penalty and termination clauses.",
      "Get rent, salary, or liability obligations clarified in exact numbers.",
      "Do not sign until arbitration/jurisdiction and exit terms are fair.",
    ],
    flaggedClauses: clauses.map((clause, index) => ({
      id: `clause-${index + 1}`,
      clause,
      riskLevel: index === 0 ? "High" : "Medium",
      whyRisky:
        "This can shift too much control to one side and may reduce your practical legal protection.",
      whatToDo:
        "Request a balanced redraft with explicit limits, notice period, and dispute process.",
    })),
    unseen: [
      "Missing dispute timeline can delay remedy.",
      "No cap on deductions may enable arbitrary charges.",
    ],
    personas: {
      vakil:
        "Several lines are one-sided. Key risk is enforceability pressure through penalties and unilateral rights.",
      aamAadmi:
        "सीधी भाषा में: कुछ नियम ऐसे हैं जिनसे आपका नुकसान हो सकता है। बदलाव लिखित में लेकर ही साइन करें।",
      nyayaadheesh:
        "Verdict: Negotiate before signing. Fix risky clauses first and preserve your exit rights.",
    },
    generatedAt: new Date().toISOString(),
    source: "mock",
  };
}

async function askClaude(apiKey, prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error("Anthropic request failed");
  }

  const json = await response.json();
  return json?.content?.[0]?.text || "";
}

async function askGemini(apiKey, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Gemini request failed");
  }

  const json = await response.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function parseJsonFromText(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function buildUsingClaude(documentText, ragContextText = "") {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const referenceBlock = ragContextText ? `\n\nUse the following retrieved legal reference context while analysing:\n${ragContextText}` : "";

  const vakilPrompt = `You are Vakil, an expert Indian lawyer. Analyse the document and reply as strict JSON with keys: flaggedClauses (array of objects with clause, riskLevel, whyRisky, whatToDo), unseen (array of strings), vakilSummary (string).${referenceBlock}\n\nDocument: ${documentText}`;

  const aadmiPrompt = `You are Aam Aadmi. Explain the document in simple Hindi and return JSON only with key aamAadmiSummary.${referenceBlock}\n\nDocument: ${documentText}`;

  const judgePrompt = `You are Nyayaadheesh. Return JSON only with keys: riskScore (1-10 number), recommendation (Sign/Negotiate/Reject), summaryEn, summaryHi, actions (array of 3 strings), judgeSummary.${referenceBlock}\n\nDocument: ${documentText}`;

  const [vakilRaw, aadmiRaw, judgeRaw] = await Promise.all([
    askClaude(apiKey, vakilPrompt),
    askClaude(apiKey, aadmiPrompt),
    askClaude(apiKey, judgePrompt),
  ]);

  const vakil = parseJsonFromText(vakilRaw);
  const aadmi = parseJsonFromText(aadmiRaw);
  const judge = parseJsonFromText(judgeRaw);

  if (!vakil || !aadmi || !judge) {
    return null;
  }

  return {
    riskScore: clamp(Number(judge.riskScore || 5), 1, 10),
    recommendation: judge.recommendation || "Negotiate",
    summaryEn: judge.summaryEn || "Legal risks detected.",
    summaryHi: judge.summaryHi || "जोखिम वाली शर्तें मिली हैं।",
    actions: Array.isArray(judge.actions) ? judge.actions.slice(0, 3) : [],
    flaggedClauses: Array.isArray(vakil.flaggedClauses) ? vakil.flaggedClauses.slice(0, 5) : [],
    unseen: Array.isArray(vakil.unseen) ? vakil.unseen.slice(0, 4) : [],
    personas: {
      vakil: vakil.vakilSummary || "Risky terms detected.",
      aamAadmi: aadmi.aamAadmiSummary || "सरल हिंदी में व्याख्या उपलब्ध है।",
      nyayaadheesh: judge.judgeSummary || "Proceed after edits.",
    },
    generatedAt: new Date().toISOString(),
    source: "anthropic",
  };
}

async function buildUsingGemini(documentText, ragContextText = "") {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const referenceBlock = ragContextText ? `\n\nUse the following retrieved legal reference context while analysing:\n${ragContextText}` : "";

  const vakilPrompt = `You are Vakil, an expert Indian lawyer. Analyse the document and reply only in strict JSON with keys: flaggedClauses (array of objects with id, clause, riskLevel, whyRisky, whatToDo), unseen (array of strings), vakilSummary (string).${referenceBlock}\n\nDocument: ${documentText}`;

  const aadmiPrompt = `You are Aam Aadmi. Explain the document in simple Hindi and reply only in strict JSON with key aamAadmiSummary.${referenceBlock}\n\nDocument: ${documentText}`;

  const judgePrompt = `You are Nyayaadheesh. Reply only in strict JSON with keys: riskScore (1-10 number), recommendation (Sign/Negotiate/Reject), summaryEn, summaryHi, actions (array of 3 strings), judgeSummary.${referenceBlock}\n\nDocument: ${documentText}`;

  const [vakilRaw, aadmiRaw, judgeRaw] = await Promise.all([
    askGemini(apiKey, vakilPrompt),
    askGemini(apiKey, aadmiPrompt),
    askGemini(apiKey, judgePrompt),
  ]);

  const vakil = parseJsonFromText(vakilRaw);
  const aadmi = parseJsonFromText(aadmiRaw);
  const judge = parseJsonFromText(judgeRaw);

  if (!vakil || !aadmi || !judge) {
    return null;
  }

  const flags = Array.isArray(vakil.flaggedClauses) ? vakil.flaggedClauses.slice(0, 5) : [];

  return {
    riskScore: clamp(Number(judge.riskScore || 5), 1, 10),
    recommendation: judge.recommendation || "Negotiate",
    summaryEn: judge.summaryEn || "Legal risks detected.",
    summaryHi: judge.summaryHi || "जोखिम वाली शर्तें मिली हैं।",
    actions: Array.isArray(judge.actions) ? judge.actions.slice(0, 3) : [],
    flaggedClauses: flags.map((item, index) => ({
      id: item.id || `clause-${index + 1}`,
      clause: item.clause || "Potentially risky clause",
      riskLevel: item.riskLevel || "Medium",
      whyRisky: item.whyRisky || "May create imbalance in obligations.",
      whatToDo: item.whatToDo || "Request written clarification before signing.",
    })),
    unseen: Array.isArray(vakil.unseen) ? vakil.unseen.slice(0, 4) : [],
    personas: {
      vakil: vakil.vakilSummary || "Risky terms detected.",
      aamAadmi: aadmi.aamAadmiSummary || "सरल हिंदी में व्याख्या उपलब्ध है।",
      nyayaadheesh: judge.judgeSummary || "Proceed after edits.",
    },
    generatedAt: new Date().toISOString(),
    source: "gemini",
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const documentText = (body?.documentText || "").trim();

    if (!documentText) {
      return Response.json({ message: "Document text is required." }, { status: 400 });
    }

    let geminiResult = null;
    let anthropicResult = null;
    const rag = buildRagContext(documentText);

    try {
      geminiResult = await buildUsingGemini(documentText, rag.contextText);
    } catch (error) {
      console.error("Gemini provider error:", error);
    }

    if (!geminiResult) {
      try {
        anthropicResult = await buildUsingClaude(documentText, rag.contextText);
      } catch (error) {
        console.error("Anthropic provider error:", error);
      }
    }

    const payload = geminiResult || anthropicResult || buildMock(documentText);

    let storedAnalysis = null;
    try {
      storedAnalysis = await storeAnalysisRecord({
        ...payload,
        documentText,
        documentPreview: documentText.slice(0, 400),
        retrieval: rag.retrieval,
        ragEnabled: rag.retrieval.length > 0,
      });
    } catch (error) {
      console.error("Failed to persist analysis:", error);
    }

    return Response.json({
      ...payload,
      documentPreview: documentText.slice(0, 400),
      retrieval: rag.retrieval,
      ragEnabled: rag.retrieval.length > 0,
      analysisId: storedAnalysis?._id || null,
      storedInMongo: Boolean(storedAnalysis),
    });
  } catch {
    return Response.json(
      { message: "Failed to analyze document." },
      { status: 500 }
    );
  }
}
