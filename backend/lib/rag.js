const DEFAULT_LEGAL_KNOWLEDGE = [
  {
    id: "indian-contract-basics",
    title: "Indian Contract Fairness Basics",
    text:
      "Contracts should avoid one-sided penalties, unreasonable forfeiture, and unilateral rights without notice. " +
      "A fair contract usually defines obligations of both parties, clear breach consequences, and measurable standards.",
  },
  {
    id: "arbitration-and-jurisdiction",
    title: "Arbitration and Jurisdiction Clauses",
    text:
      "Arbitration clauses should specify neutral process, seat, and cost-sharing. " +
      "If one party alone chooses arbitrator or venue, it can create power imbalance. Jurisdiction terms should be practical for both parties.",
  },
  {
    id: "employment-non-compete",
    title: "Employment and Non-Compete Risk",
    text:
      "Employment agreements with broad non-compete terms, automatic deductions, or indefinite lock-in periods can be oppressive. " +
      "Clauses should define geographic scope, time limit, and legitimate business purpose.",
  },
  {
    id: "rental-deposit-and-exit",
    title: "Rental Deposit and Exit Terms",
    text:
      "Rent agreements should clearly define refund timeline, permissible deductions, notice period, and early exit conditions. " +
      "Blanket forfeiture of full deposit for any early exit is often disputed as disproportionate.",
  },
  {
    id: "consumer-terms-renewal",
    title: "Consumer Terms and Auto-Renewal",
    text:
      "Auto-renewal and hidden fee terms should be explicit, prominent, and cancellable with reasonable notice. " +
      "Silence-based acceptance and unilateral price-change clauses increase consumer risk.",
  },
];

function normalizeToken(token) {
  return token.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]/g, "");
}

function tokenize(text) {
  return text
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 2);
}

function toTermFrequency(tokens) {
  const termFrequency = new Map();

  for (const token of tokens) {
    termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
  }

  return termFrequency;
}

function cosineSimilarity(tfA, tfB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const value of tfA.values()) {
    normA += value * value;
  }

  for (const value of tfB.values()) {
    normB += value * value;
  }

  for (const [token, valueA] of tfA.entries()) {
    const valueB = tfB.get(token) || 0;
    dot += valueA * valueB;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function chunkText(text, chunkSize = 240) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= chunkSize) {
    return [text];
  }

  const chunks = [];
  for (let start = 0; start < words.length; start += chunkSize) {
    chunks.push(words.slice(start, start + chunkSize).join(" "));
  }

  return chunks;
}

function buildKnowledgeChunks(knowledgeItems = DEFAULT_LEGAL_KNOWLEDGE) {
  return knowledgeItems.flatMap((item) => {
    const fullText = `${item.title}. ${item.text}`;
    const chunks = chunkText(fullText);

    return chunks.map((chunk, index) => ({
      id: `${item.id}-${index + 1}`,
      title: item.title,
      text: chunk,
      tf: toTermFrequency(tokenize(chunk)),
    }));
  });
}

const KNOWLEDGE_CHUNKS = buildKnowledgeChunks();

export function retrieveRelevantContext(queryText, topK = 3) {
  const queryTf = toTermFrequency(tokenize(queryText || ""));

  const scored = KNOWLEDGE_CHUNKS.map((item) => ({
    ...item,
    score: cosineSimilarity(queryTf, item.tf),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((item) => ({
    id: item.id,
    title: item.title,
    text: item.text,
    score: Number(item.score.toFixed(4)),
  }));
}

export function buildRagContext(queryText) {
  const retrieval = retrieveRelevantContext(queryText, 3);

  if (retrieval.length === 0) {
    return {
      contextText: "",
      retrieval,
    };
  }

  const contextText = retrieval
    .map(
      (item, index) =>
        `[Context ${index + 1}] ${item.title} | relevance=${item.score}\n${item.text}`
    )
    .join("\n\n");

  return {
    contextText,
    retrieval,
  };
}
