"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageWrap, SiteFooter, SiteHeader } from "../components/SiteShell";
import { readAnalysis } from "../lib/analysis-storage";

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
  const [result, setResult] = useState(() => readAnalysis());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState("");

  useEffect(() => {
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
  }, [result]);

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
      setSpeechError("Text-to-speech is not supported in this browser.");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setSpeechError("");
    const summary = [
      `Risk score ${result.riskScore} out of ten.`,
      `Recommendation: ${result.recommendation}.`,
      `Summary in English: ${result.summaryEn}`,
      `Hindi summary: ${result.summaryHi}`,
      `Top actions: ${result.actions?.join(". ")}`,
    ].join(" ");

    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setSpeechError("Could not play voice summary.");
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
              <h1 className="font-title text-3xl text-[color:var(--navy)]">No analysis found yet</h1>
              <p className="mt-3 text-[color:var(--ink)]/75">Run your first document analysis to see verdict and flagged clauses.</p>
              <Link
                href="/app"
                className="mt-6 inline-block rounded-full bg-[color:var(--saffron)] px-6 py-3 text-sm font-bold text-white"
              >
                Go to Analyzer
              </Link>
            </section>
          ) : (
            <>
              <div className="reveal">
                <p className="kicker">Verdict</p>
                <h1 className="font-title text-4xl text-[color:var(--navy)] md:text-5xl">Nyaya Sabha Analysis</h1>
              </div>

              <section className="mt-6 grid gap-5 md:grid-cols-[1fr_1.2fr]">
                <article className="panel rounded-3xl p-6">
                  <p className="text-sm text-[color:var(--navy)]/70">Risk Score</p>
                  <p className="font-title mt-2 text-6xl text-[color:var(--saffron)]">{result.riskScore}/10</p>
                  <p className="mt-3 rounded-xl bg-[color:var(--navy)] px-3 py-2 text-sm font-semibold text-white">Recommendation: {result.recommendation}</p>
                  <p className="mt-4 text-sm text-[color:var(--ink)]/80">{result.summaryEn}</p>
                  <p className="font-hindi mt-2 text-sm text-[color:var(--ink)]/80">{result.summaryHi}</p>
                </article>

                <article className="panel rounded-3xl p-6">
                  <p className="kicker">Top 3 Action Items</p>
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
                  <p className="text-sm font-bold text-[color:var(--saffron)]">⚖ Vakil</p>
                  <p className="mt-2 text-sm text-[color:var(--ink)]/80">{result.personas?.vakil}</p>
                </article>
                <article className="panel rounded-2xl p-5">
                  <p className="text-sm font-bold text-[color:var(--saffron)]">🧑‍🌾 Aam Aadmi</p>
                  <p className="font-hindi mt-2 text-sm text-[color:var(--ink)]/80">{result.personas?.aamAadmi}</p>
                </article>
                <article className="panel rounded-2xl p-5">
                  <p className="text-sm font-bold text-[color:var(--saffron)]">🏛 Nyayaadheesh</p>
                  <p className="mt-2 text-sm text-[color:var(--ink)]/80">{result.personas?.nyayaadheesh}</p>
                </article>
              </section>

              <section className="mt-6 panel rounded-3xl p-6">
                <p className="kicker">Flagged Clauses (Red Alerts)</p>
                <div className="mt-4 space-y-3">
                  {result.flaggedClauses?.map((item) => (
                    <div key={item.id || item.clause} className="rounded-2xl border-l-4 border-red-600 bg-red-50 px-4 py-3">
                      <p className="text-sm font-semibold text-red-900">{item.clause}</p>
                      <p className="mt-1 text-xs text-red-800">Why risky: {item.whyRisky}</p>
                      <p className="mt-1 text-xs text-red-800">What to do: {item.whatToDo}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-6 panel rounded-3xl p-6">
                <p className="kicker">The Unseen</p>
                <ul className="mt-3 space-y-2 text-sm text-[color:var(--ink)]/85">
                  {result.unseen?.map((tip) => (
                    <li key={tip} className="rounded-xl bg-white/70 px-3 py-2">{tip}</li>
                  ))}
                </ul>
              </section>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/app" className="rounded-full border border-[color:var(--navy)]/25 bg-white px-5 py-2 text-sm text-[color:var(--navy)]">
                  Re-analyse
                </Link>
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className="rounded-full border border-[color:var(--navy)]/25 bg-white px-5 py-2 text-sm text-[color:var(--navy)]"
                >
                  {isSpeaking ? "Stop Voice" : "Listen to Verdict"}
                </button>
                <Link href="/export" className="rounded-full bg-[color:var(--saffron)] px-5 py-2 text-sm font-semibold text-white">
                  Export / Download
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
