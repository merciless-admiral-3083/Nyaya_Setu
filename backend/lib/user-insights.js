const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "your",
  "have",
  "will",
  "about",
  "into",
  "document",
  "clause",
  "risk",
  "legal",
]);

export function extractIgnoredPatterns(analyses = []) {
  const unseenCounts = new Map();

  analyses.forEach((item) => {
    const tips = Array.isArray(item?.unseen) ? item.unseen : [];
    tips.forEach((tip) => {
      const normalized = String(tip || "").trim();
      if (!normalized) {
        return;
      }

      unseenCounts.set(normalized, (unseenCounts.get(normalized) || 0) + 1);
    });
  });

  return [...unseenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text, count]) => ({
      text,
      count,
      label: count >= 3 ? "Often ignored" : "Sometimes ignored",
    }));
}

export function extractCommonTerms(analyses = []) {
  const tokenCounts = new Map();

  analyses.forEach((item) => {
    const source = `${item?.documentPreview || ""} ${Array.isArray(item?.flaggedClauses) ? item.flaggedClauses.map((x) => x?.clause).join(" ") : ""}`;

    source
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 4 && !STOPWORDS.has(token))
      .forEach((token) => {
        tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
      });
  });

  return [...tokenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([term, count]) => ({ term, count }));
}

export function buildUserInsightSummary(analyses = []) {
  const ignored = extractIgnoredPatterns(analyses);
  const terms = extractCommonTerms(analyses);

  return {
    totalAnalyses: analyses.length,
    ignoredPatterns: ignored,
    recurringTerms: terms,
  };
}
