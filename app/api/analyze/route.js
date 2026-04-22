import { buildRagContext } from "../../../backend/lib/rag";
import { storeAnalysisRecord } from "../../../backend/lib/analysis-db";
export const runtime = "nodejs";
const ANTHROPIC_MODEL = "claude-3-5-sonnet-latest";
const GEMINI_MODEL = "gemini-1.5-flash";

const LANGUAGE_MODES = {
  ENGLISH: "english",
  HINDI: "hindi",
  HINGLISH: "hinglish",
};

function detectOutputLanguage(text) {
  const source = `${text || ""}`.trim();
  if (!source) {
    return LANGUAGE_MODES.ENGLISH;
  }

  if (/[\u0900-\u097F]/.test(source)) {
    return LANGUAGE_MODES.HINDI;
  }

  const words = source.toLowerCase().match(/[a-z']+/g) || [];
  if (words.length === 0) {
    return LANGUAGE_MODES.ENGLISH;
  }

  const hinglishWords = new Set([
    "mujhe",
    "mera",
    "meri",
    "mere",
    "main",
    "kya",
    "kyu",
    "kaise",
    "hain",
    "hai",
    "nahi",
    "haan",
    "batao",
    "samjhao",
    "samjha",
    "karna",
    "banwana",
    "kiraya",
    "jaldi",
    "krna",
  ]);

  let hits = 0;
  words.forEach((word) => {
    if (hinglishWords.has(word)) {
      hits += 1;
    }
  });

  const ratio = hits / words.length;
  return hits >= 3 || ratio >= 0.2 ? LANGUAGE_MODES.HINGLISH : LANGUAGE_MODES.ENGLISH;
}

function resolveOutputLanguage(body, documentText) {
  const preferred = `${body?.preferredOutputLanguage || ""}`.toLowerCase().trim();
  if (preferred === LANGUAGE_MODES.ENGLISH || preferred === LANGUAGE_MODES.HINDI || preferred === LANGUAGE_MODES.HINGLISH) {
    return preferred;
  }

  return detectOutputLanguage(documentText);
}

function outputLanguageInstruction(outputLanguage) {
  if (outputLanguage === LANGUAGE_MODES.HINDI) {
    return "Hindi written in Devanagari script only";
  }

  if (outputLanguage === LANGUAGE_MODES.HINGLISH) {
    return "Hinglish only (Hindi-English mix written in Roman script)";
  }

  return "English only";
}

function localizedMockStrings(outputLanguage) {
  if (outputLanguage === LANGUAGE_MODES.HINDI) {
    return {
      recommendation: "सावधानी से आगे बढ़ें",
      summary: "इस दस्तावेज़ में कुछ ऐसी शर्तें हैं जो बिना बदलाव के साइन करने पर आर्थिक या कानूनी नुकसान कर सकती हैं।",
      actions: [
        "एकतरफा पेनल्टी और टर्मिनेशन क्लॉज में लिखित बदलाव मांगें।",
        "किराया, देनदारी और कटौती की रकम स्पष्ट और लिखित में तय कराएं।",
        "आर्बिट्रेशन, क्षेत्राधिकार और एग्जिट शर्तें संतुलित हुए बिना साइन न करें।",
      ],
      riskHigh: "उच्च",
      riskMedium: "मध्यम",
      whyRisky:
        "यह शर्त एक पक्ष को अधिक नियंत्रण दे सकती है और आपके व्यावहारिक कानूनी संरक्षण को कम कर सकती है।",
      whatToDo:
        "स्पष्ट सीमाओं, नोटिस अवधि और विवाद प्रक्रिया के साथ संतुलित ड्राफ्ट लिखित में मांगें।",
      unseen: [
        "विवाद के लिए स्पष्ट समय-सीमा न होने पर समाधान में देरी हो सकती है।",
        "कटौती पर सीमा न होने से मनमानी चार्ज लगने का जोखिम बढ़ता है।",
      ],
      vakil:
        "कई पंक्तियां एकतरफा हैं। मुख्य जोखिम पेनल्टी और एक-पक्षीय अधिकारों के जरिए दबाव बनना है।",
      aamAadmi:
        "सीधी भाषा में: कुछ नियम आपके खिलाफ जा सकते हैं। लिखित बदलाव लेकर ही साइन करें।",
      nyayaadheesh:
        "निर्णय: अभी बातचीत करें। जोखिम वाली शर्तें सुधरने के बाद ही साइन करें।",
    };
  }

  if (outputLanguage === LANGUAGE_MODES.HINGLISH) {
    return {
      recommendation: "Pehle negotiate karo",
      summary: "Is document me kuch clauses aise hain jo bina change sign karne par legal ya financial nuksan kara sakte hain.",
      actions: [
        "One-sided penalty aur termination clauses me written changes lo.",
        "Rent, liability aur deduction amounts exact numbers me clear karao.",
        "Arbitration, jurisdiction aur exit terms fair hone se pehle sign mat karo.",
      ],
      riskHigh: "High",
      riskMedium: "Medium",
      whyRisky:
        "Yeh clause ek side ko zyada control de sakta hai aur aapki practical legal protection kam kar sakta hai.",
      whatToDo:
        "Clear limits, notice period aur dispute process ke saath balanced redraft written me mango.",
      unseen: [
        "Dispute timeline missing ho to remedy late mil sakti hai.",
        "Deduction cap clear na ho to arbitrary charges ka risk badhta hai.",
      ],
      vakil:
        "Kaafi lines one-sided lag rahi hain. Core risk penalties aur unilateral rights se pressure create hona hai.",
      aamAadmi:
        "Simple bolun to kuch rules aapke against ja sakte hain. Written changes ke bina sign mat karo.",
      nyayaadheesh:
        "Final verdict: Abhi negotiate karo. Risky clauses fix hone ke baad hi sign karo.",
    };
  }

  return {
    recommendation: "Proceed with caution",
    summary: "This document contains clauses that can create financial or legal disadvantage if signed without edits.",
    actions: [
      "Ask for written changes to one-sided penalty and termination clauses.",
      "Get rent, salary, or liability obligations clarified in exact numbers.",
      "Do not sign until arbitration, jurisdiction, and exit terms are fair.",
    ],
    riskHigh: "High",
    riskMedium: "Medium",
    whyRisky:
      "This can shift too much control to one side and may reduce your practical legal protection.",
    whatToDo:
      "Request a balanced redraft with explicit limits, notice period, and dispute process.",
    unseen: [
      "Missing dispute timeline can delay remedy.",
      "No cap on deductions may enable arbitrary charges.",
    ],
    vakil:
      "Several lines are one-sided. Key risk is enforceability pressure through penalties and unilateral rights.",
    aamAadmi:
      "In simple words: some terms may hurt you. Do not sign until written edits are added.",
    nyayaadheesh:
      "Verdict: Negotiate before signing. Fix risky clauses first and preserve your exit rights.",
  };
}
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

function buildMock(documentText, outputLanguage) {
  const clauses = findRiskClauses(documentText);
  const riskScore = clamp(4 + clauses.length * 1.3, 1, 10);
  const localized = localizedMockStrings(outputLanguage);

  return {
    riskScore: Number(riskScore.toFixed(1)),
    recommendation: localized.recommendation,
    summary: localized.summary,
    summaryEn: localized.summary,
    summaryHi: localized.summary,
    actions: localized.actions,
    flaggedClauses: clauses.map((clause, index) => ({
      id: `clause-${index + 1}`,
      clause,
      riskLevel: index === 0 ? localized.riskHigh : localized.riskMedium,
      whyRisky: localized.whyRisky,
      whatToDo: localized.whatToDo,
    })),
    unseen: localized.unseen,
    personas: {
      vakil: localized.vakil,
      aamAadmi: localized.aamAadmi,
      nyayaadheesh: localized.nyayaadheesh,
    },
    outputLanguage,
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
    const details = await response.text().catch(() => "");
    throw new Error(`Anthropic request failed (${response.status}): ${details.slice(0, 240)}`);
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
    const details = await response.text().catch(() => "");
    throw new Error(`Gemini request failed (${response.status}): ${details.slice(0, 240)}`);
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

async function buildUsingClaude(documentText, outputLanguage, ragContextText = "") {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const languageRule = outputLanguageInstruction(outputLanguage);
  const localized = localizedMockStrings(outputLanguage);
  const referenceBlock = ragContextText ? `\n\nUse the following retrieved legal reference context while analysing:\n${ragContextText}` : "";

  const vakilPrompt = `You are Vakil, an expert Indian lawyer. Analyse the document and reply as strict JSON with keys: flaggedClauses (array of objects with clause, riskLevel, whyRisky, whatToDo), unseen (array of strings), vakilSummary (string). All textual fields must be in ${languageRule}. Do not mix with any other language.${referenceBlock}\n\nDocument: ${documentText}`;

  const aadmiPrompt = `You are Aam Aadmi. Explain the document in simple language and return JSON only with key aamAadmiSummary. Output must be in ${languageRule}. Do not mix languages.${referenceBlock}\n\nDocument: ${documentText}`;

  const judgePrompt = `You are Nyayaadheesh. Return JSON only with keys: riskScore (1-10 number), recommendation (string), summary (string), actions (array of 3 strings), judgeSummary (string). All text must be in ${languageRule}.${referenceBlock}\n\nDocument: ${documentText}`;

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
    recommendation: judge.recommendation || localized.recommendation,
    summary: judge.summary || localized.summary,
    summaryEn: judge.summary || localized.summary,
    summaryHi: judge.summary || localized.summary,
    actions: Array.isArray(judge.actions) && judge.actions.length > 0 ? judge.actions.slice(0, 3) : localized.actions,
    flaggedClauses:
      Array.isArray(vakil.flaggedClauses) && vakil.flaggedClauses.length > 0
        ? vakil.flaggedClauses.slice(0, 5)
        : findRiskClauses(documentText).map((clause, index) => ({
            id: `clause-${index + 1}`,
            clause,
            riskLevel: index === 0 ? localized.riskHigh : localized.riskMedium,
            whyRisky: localized.whyRisky,
            whatToDo: localized.whatToDo,
          })),
    unseen: Array.isArray(vakil.unseen) && vakil.unseen.length > 0 ? vakil.unseen.slice(0, 4) : localized.unseen,
    personas: {
      vakil: vakil.vakilSummary || localized.vakil,
      aamAadmi: aadmi.aamAadmiSummary || localized.aamAadmi,
      nyayaadheesh: judge.judgeSummary || localized.nyayaadheesh,
    },
    outputLanguage,
    generatedAt: new Date().toISOString(),
    source: "anthropic",
  };
}

async function buildUsingGemini(documentText, outputLanguage, ragContextText = "") {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const languageRule = outputLanguageInstruction(outputLanguage);
  const localized = localizedMockStrings(outputLanguage);
  const referenceBlock = ragContextText ? `\n\nUse the following retrieved legal reference context while analysing:\n${ragContextText}` : "";

  const vakilPrompt = `You are Vakil, an expert Indian lawyer. Analyse the document and reply only in strict JSON with keys: flaggedClauses (array of objects with id, clause, riskLevel, whyRisky, whatToDo), unseen (array of strings), vakilSummary (string). All textual fields must be in ${languageRule}. Do not mix with any other language.${referenceBlock}\n\nDocument: ${documentText}`;

  const aadmiPrompt = `You are Aam Aadmi. Explain the document in simple language and reply only in strict JSON with key aamAadmiSummary. Output must be in ${languageRule}. Do not mix languages.${referenceBlock}\n\nDocument: ${documentText}`;

  const judgePrompt = `You are Nyayaadheesh. Reply only in strict JSON with keys: riskScore (1-10 number), recommendation (string), summary (string), actions (array of 3 strings), judgeSummary (string). All text must be in ${languageRule}.${referenceBlock}\n\nDocument: ${documentText}`;

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
    recommendation: judge.recommendation || localized.recommendation,
    summary: judge.summary || localized.summary,
    summaryEn: judge.summary || localized.summary,
    summaryHi: judge.summary || localized.summary,
    actions: Array.isArray(judge.actions) && judge.actions.length > 0 ? judge.actions.slice(0, 3) : localized.actions,
    flaggedClauses:
      flags.length > 0
        ? flags.map((item, index) => ({
            id: item.id || `clause-${index + 1}`,
            clause: item.clause || "Potentially risky clause",
            riskLevel: item.riskLevel || localized.riskMedium,
            whyRisky: item.whyRisky || localized.whyRisky,
            whatToDo: item.whatToDo || localized.whatToDo,
          }))
        : findRiskClauses(documentText).map((clause, index) => ({
            id: `clause-${index + 1}`,
            clause,
            riskLevel: index === 0 ? localized.riskHigh : localized.riskMedium,
            whyRisky: localized.whyRisky,
            whatToDo: localized.whatToDo,
          })),
    unseen: Array.isArray(vakil.unseen) && vakil.unseen.length > 0 ? vakil.unseen.slice(0, 4) : localized.unseen,
    personas: {
      vakil: vakil.vakilSummary || localized.vakil,
      aamAadmi: aadmi.aamAadmiSummary || localized.aamAadmi,
      nyayaadheesh: judge.judgeSummary || localized.nyayaadheesh,
    },
    outputLanguage,
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

    const outputLanguage = resolveOutputLanguage(body, documentText);
    let geminiResult = null;
    let anthropicResult = null;
    const rag = buildRagContext(documentText);

    try {
      geminiResult = await buildUsingGemini(documentText, outputLanguage, rag.contextText);
    } catch (error) {
      console.error("Gemini provider error:", error);
    }

    if (!geminiResult) {
      try {
        anthropicResult = await buildUsingClaude(documentText, outputLanguage, rag.contextText);
      } catch (error) {
        console.error("Anthropic provider error:", error);
      }
    }

    const payload = geminiResult || anthropicResult || buildMock(documentText, outputLanguage);

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
