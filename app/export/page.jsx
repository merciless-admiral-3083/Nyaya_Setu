"use client";

import Link from "next/link";
import { useState } from "react";
import { PageWrap, SiteFooter, SiteHeader } from "../../components/SiteShell";
import { readAnalysis } from "../../lib/analysis-storage";

export default function ExportPage() {
  const [result] = useState(() => readAnalysis());

  return (
    <div className="flex min-h-screen flex-col print:bg-white">
      <SiteHeader compact />
      <main className="flex-1 py-10 print:py-0">
        <PageWrap>
          {!result ? (
            <section className="panel rounded-3xl p-8 text-center">
              <h1 className="font-title text-3xl text-[color:var(--navy)]">Nothing to export yet</h1>
              <Link href="/app" className="mt-5 inline-block rounded-full bg-[color:var(--saffron)] px-6 py-2 text-sm font-bold text-white">
                Analyze a Document
              </Link>
            </section>
          ) : (
            <section className="panel rounded-3xl p-7 print:shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--navy)]/20 pb-4">
                <div>
                  <h1 className="font-title text-3xl text-[color:var(--navy)]">NyayaSetu Report</h1>
                  <p className="text-sm text-[color:var(--ink)]/70">Generated: {new Date(result.generatedAt).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-[color:var(--navy)] px-4 py-2 text-white">
                  <p className="text-xs">Risk Score</p>
                  <p className="font-title text-2xl text-[color:var(--mustard)]">{result.riskScore}/10</p>
                </div>
              </div>

              <div className="mt-5 space-y-5 text-sm text-[color:var(--ink)]/85">
                <section>
                  <h2 className="font-title text-xl text-[color:var(--navy)]">Final Recommendation</h2>
                  <p className="mt-1">{result.recommendation}</p>
                  <p className="mt-2">{result.summaryEn}</p>
                  <p className="font-hindi mt-1">{result.summaryHi}</p>
                </section>

                <section>
                  <h2 className="font-title text-xl text-[color:var(--navy)]">Top Action Items</h2>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    {result.actions?.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ol>
                </section>

                <section>
                  <h2 className="font-title text-xl text-[color:var(--navy)]">Flagged Clauses</h2>
                  <ul className="mt-2 space-y-2">
                    {result.flaggedClauses?.map((item) => (
                      <li key={item.id || item.clause} className="rounded-xl border border-red-300 bg-red-50 px-3 py-2">
                        <p className="font-semibold text-red-900">{item.clause}</p>
                        <p className="text-xs text-red-800">Risk: {item.riskLevel}</p>
                        <p className="text-xs text-red-800">Fix: {item.whatToDo}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="mt-7 flex flex-wrap gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full bg-[color:var(--saffron)] px-5 py-2 text-sm font-semibold text-white"
                >
                  Download PDF (Print)
                </button>
                <Link href="/results" className="rounded-full border border-[color:var(--navy)]/25 bg-white px-5 py-2 text-sm text-[color:var(--navy)]">
                  Back to Results
                </Link>
              </div>
            </section>
          )}
        </PageWrap>
      </main>
      <SiteFooter />
    </div>
  );
}
