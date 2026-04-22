"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageWrap, SiteFooter, SiteHeader } from "../components/SiteShell";
import { readAnalysis } from "../lib/analysis-storage";

const LANGUAGE_MODES = {
  ENGLISH: "english",
  HINDI: "hindi",
  HINGLISH: "hinglish",
};

function uiCopy(mode) {
  if (mode === LANGUAGE_MODES.HINDI) {
    return {
      noAnalysisTitle: "अभी कोई विश्लेषण नहीं मिला",
      noAnalysisBody: "परिणाम देखने के लिए पहले दस्तावेज़ का विश्लेषण चलाएं।",
      goToAnalyzer: "विश्लेषक पर जाएं",
      verdictKicker: "निर्णय",
      verdictTitle: "न्याय सभा विश्लेषण",
      riskScore: "जोखिम स्कोर",
      recommendation: "सिफारिश",
      topActions: "शीर्ष 3 कार्य बिंदु",
      flaggedClauses: "चिन्हित क्लॉज (रेड अलर्ट)",
      whyRisky: "जोखिम क्यों",
      whatToDo: "क्या करें",
      unseen: "अनदेखे बिंदु",
      reAnalyze: "फिर से विश्लेषण",
      stopVoice: "आवाज बंद करें",
      listenVerdict: "निर्णय सुनें",
      export: "एक्सपोर्ट / डाउनलोड",
      ttsNotSupported: "इस ब्राउज़र में टेक्स्ट-टू-स्पीच समर्थित नहीं है।",
      ttsFailed: "वॉइस सारांश चलाया नहीं जा सका।",
      ttsRiskPrefix: "जोखिम स्कोर",
      ttsOutOfTen: "दस में से",
      ttsRecommendation: "सिफारिश",
      ttsSummary: "सारांश",
      ttsActions: "मुख्य कार्य",
      speechLang: "hi-IN",
      vakilLabel: "⚖ वकील",
      aadmiLabel: "🧑‍🌾 आम आदमी",
      judgeLabel: "🏛 न्यायाधीश",
    };
  }

  if (mode === LANGUAGE_MODES.HINGLISH) {
    return {
      noAnalysisTitle: "Abhi koi analysis nahi mila",
      noAnalysisBody: "Result dekhne ke liye pehle document analysis run karo.",
      goToAnalyzer: "Analyzer par jao",
      verdictKicker: "Verdict",
      verdictTitle: "Nyaya Sabha Analysis",
      riskScore: "Risk Score",
      recommendation: "Recommendation",
      topActions: "Top 3 Action Items",
      flaggedClauses: "Flagged Clauses (Red Alerts)",
      whyRisky: "Why risky",
      whatToDo: "What to do",
      unseen: "The Unseen",
      reAnalyze: "Re-analyse",
      stopVoice: "Stop Voice",
      listenVerdict: "Listen to Verdict",
      export: "Export / Download",
      ttsNotSupported: "Text-to-speech is browser me supported nahi hai.",
      ttsFailed: "Voice summary play nahi ho paya.",
      ttsRiskPrefix: "Risk score",
      ttsOutOfTen: "out of ten",
      ttsRecommendation: "Recommendation",
      ttsSummary: "Summary",
      ttsActions: "Top actions",
      speechLang: "en-IN",
      vakilLabel: "⚖ Vakil",
      aadmiLabel: "🧑‍🌾 Aam Aadmi",
      judgeLabel: "🏛 Nyayaadheesh",
    };
  }

  return {
    noAnalysisTitle: "No analysis found yet",
    noAnalysisBody: "Run your first document analysis to see verdict and flagged clauses.",
    goToAnalyzer: "Go to Analyzer",
    verdictKicker: "Verdict",
    verdictTitle: "Nyaya Sabha Analysis",
    riskScore: "Risk Score",
    recommendation: "Recommendation",
    topActions: "Top 3 Action Items",
    flaggedClauses: "Flagged Clauses (Red Alerts)",
    whyRisky: "Why risky",
    whatToDo: "What to do",
    unseen: "The Unseen",
    reAnalyze: "Re-analyse",
    stopVoice: "Stop Voice",
    listenVerdict: "Listen to Verdict",
    export: "Export / Download",
    ttsNotSupported: "Text-to-speech is not supported in this browser.",
    ttsFailed: "Could not play voice summary.",
    ttsRiskPrefix: "Risk score",
    ttsOutOfTen: "out of ten",
    ttsRecommendation: "Recommendation",
    ttsSummary: "Summary",
    ttsActions: "Top actions",
    speechLang: "en-IN",
    vakilLabel: "⚖ Vakil",
    aadmiLabel: "🧑‍🌾 Aam Aadmi",
    judgeLabel: "🏛 Nyayaadheesh",
  };
}

async function loadLatestAnalysis() {
  try {
    const response = await fetch("/api/analyses", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.analysis || null;
  } catch {
    return null;
  }
}

export default function ResultsPage() {
  const [result, setResult] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const outputLanguage = result?.outputLanguage || LANGUAGE_MODES.ENGLISH;
  const copy = uiCopy(outputLanguage);
  const summaryText = result?.summary || result?.summaryEn || result?.summaryHi || "";

  useEffect(() => {
    setIsHydrated(true);
    const cached = readAnalysis();
    if (cached) {
      setResult(cached);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (result) {
      return;
    }

    let isActive = true;

    loadLatestAnalysis().then((latest) => {
      if (isActive && latest) {
        setResult(latest);
      }
    });

    return () => {
      isActive = false;
    };
  }, [result, isHydrated]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  function toggleSpeech() {
    if (!result) {
      return;
    }

    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSpeechError(copy.ttsNotSupported);
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setSpeechError("");
    const summary = [
      `${copy.ttsRiskPrefix} ${result.riskScore} ${copy.ttsOutOfTen}.`,
      `${copy.ttsRecommendation}: ${result.recommendation}.`,
      `${copy.ttsSummary}: ${summaryText}`,
      `${copy.ttsActions}: ${result.actions?.join(". ") || ""}`,
    ].join(" ");

    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = copy.speechLang;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setSpeechError(copy.ttsFailed);
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader compact />
      <main className="flex-1 py-10 md:py-14">
        <PageWrap>
          {!result ? (
            <section className="panel rounded-3xl p-8 text-center">
              <h1 className="font-title text-3xl text-[color:var(--navy)]">{copy.noAnalysisTitle}</h1>
              <p className="mt-3 text-[color:var(--ink)]/75">{copy.noAnalysisBody}</p>
              <Link
                href="/app"
                className="mt-6 inline-block rounded-full bg-[color:var(--saffron)] px-6 py-3 text-sm font-bold text-white"
              >
                {copy.goToAnalyzer}
              </Link>
            </section>
          ) : (
            <>
              <div className="reveal">
                <p className="kicker">{copy.verdictKicker}</p>
                <h1 className="font-title text-4xl text-[color:var(--navy)] md:text-5xl">{copy.verdictTitle}</h1>
              </div>

              <section className="mt-6 grid gap-5 md:grid-cols-[1fr_1.2fr]">
                <article className="panel rounded-3xl p-6">
                  <p className="text-sm text-[color:var(--navy)]/70">{copy.riskScore}</p>
                  <p className="font-title mt-2 text-6xl text-[color:var(--saffron)]">{result.riskScore}/10</p>
                  <p className="mt-3 rounded-xl bg-[color:var(--navy)] px-3 py-2 text-sm font-semibold text-white">{copy.recommendation}: {result.recommendation}</p>
                  <p className="mt-4 text-sm text-[color:var(--ink)]/80">{summaryText}</p>
                </article>

                <article className="panel rounded-3xl p-6">
                  <p className="kicker">{copy.topActions}</p>
                  <ul className="mt-4 space-y-3 text-sm text-[color:var(--ink)]/85">
                    {result.actions?.map((action) => (
                      <li key={action} className="rounded-xl border border-[color:var(--navy)]/15 bg-white/70 px-3 py-2">
                        {action}
                      </li>
                    ))}
                  </ul>
                </article>
              </section>

              <section className="mt-6 grid gap-4 md:grid-cols-3">
                <article className="panel rounded-2xl p-5">
                  <p className="text-sm font-bold text-[color:var(--saffron)]">{copy.vakilLabel}</p>
                  <p className="mt-2 text-sm text-[color:var(--ink)]/80">{result.personas?.vakil}</p>
                </article>
                <article className="panel rounded-2xl p-5">
                  <p className="text-sm font-bold text-[color:var(--saffron)]">{copy.aadmiLabel}</p>
                  <p className="font-hindi mt-2 text-sm text-[color:var(--ink)]/80">{result.personas?.aamAadmi}</p>
                </article>
                <article className="panel rounded-2xl p-5">
                  <p className="text-sm font-bold text-[color:var(--saffron)]">{copy.judgeLabel}</p>
                  <p className="mt-2 text-sm text-[color:var(--ink)]/80">{result.personas?.nyayaadheesh}</p>
                </article>
              </section>

              <section className="mt-6 panel rounded-3xl p-6">
                <p className="kicker">{copy.flaggedClauses}</p>
                <div className="mt-4 space-y-3">
                  {result.flaggedClauses?.map((item) => (
                    <div key={item.id || item.clause} className="rounded-2xl border-l-4 border-red-600 bg-red-50 px-4 py-3">
                      <p className="text-sm font-semibold text-red-900">{item.clause}</p>
                      <p className="mt-1 text-xs text-red-800">{copy.whyRisky}: {item.whyRisky}</p>
                      <p className="mt-1 text-xs text-red-800">{copy.whatToDo}: {item.whatToDo}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-6 panel rounded-3xl p-6">
                <p className="kicker">{copy.unseen}</p>
                <ul className="mt-3 space-y-2 text-sm text-[color:var(--ink)]/85">
                  {result.unseen?.map((tip) => (
                    <li key={tip} className="rounded-xl bg-white/70 px-3 py-2">{tip}</li>
                  ))}
                </ul>
              </section>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/app" className="rounded-full border border-[color:var(--navy)]/25 bg-white px-5 py-2 text-sm text-[color:var(--navy)]">
                  {copy.reAnalyze}
                </Link>
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className="rounded-full border border-[color:var(--navy)]/25 bg-white px-5 py-2 text-sm text-[color:var(--navy)]"
                >
                  {isSpeaking ? copy.stopVoice : copy.listenVerdict}
                </button>
                <Link href="/export" className="rounded-full bg-[color:var(--saffron)] px-5 py-2 text-sm font-semibold text-white">
                  {copy.export}
                </Link>
              </div>
              {speechError ? <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{speechError}</p> : null}
            </>
          )}
        </PageWrap>
      </main>
      <SiteFooter />
    </div>
  );
}
