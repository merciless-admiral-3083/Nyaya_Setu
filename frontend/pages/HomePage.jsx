import Link from "next/link";
import { PageWrap, SiteFooter, SiteHeader } from "../components/SiteShell";

const featureCards = [
  {
    title: "Scan a contract",
    text: "Paste text, upload a document, or use voice input to inspect clauses in plain language.",
  },
  {
    title: "Find risky clauses",
    text: "The analyzer flags one-sided terms, hidden penalties, and confusing obligations.",
  },
  {
    title: "Keep your history",
    text: "Saved analyses and profile details stay organized so you can revisit them later.",
  },
];

const trustPoints = [
  "Simple language summaries",
  "Bilingual support",
  "Fast route to analysis",
  "Built for Indian users",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,185,66,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(232,118,45,0.16),transparent_28%),linear-gradient(180deg,#fffaf2_0%,#fff7ec_52%,#f8efe3_100%)] text-[color:var(--navy)]">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden py-16 md:py-24">
          <PageWrap>
            <div className="grid gap-12 md:grid-cols-[1.15fr_0.85fr] md:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--navy)]/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--navy)]/70 backdrop-blur-sm">
                  AI legal aid for everyday documents
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-3xl font-title text-5xl leading-tight text-[color:var(--navy)] md:text-7xl">
                    Understand legal text before you sign it.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-[color:var(--navy)]/80 md:text-xl">
                    NyayaSetu explains contracts, notices, and agreements in clear English or Hindi,
                    then highlights the parts that deserve a second look.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/app"
                    className="inline-flex items-center justify-center rounded-full bg-[color:var(--saffron)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(232,118,45,0.28)] transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Start analysis
                  </Link>
                  <Link
                    href="/results"
                    className="inline-flex items-center justify-center rounded-full border border-[color:var(--navy)]/15 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--navy)] backdrop-blur-sm transition-colors duration-200 hover:bg-white"
                  >
                    View latest result
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {trustPoints.map((point) => (
                    <div key={point} className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm shadow-[0_8px_24px_rgba(26,43,74,0.06)] backdrop-blur-sm">
                      {point}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-8 top-12 h-28 w-28 rounded-full bg-[color:var(--mustard)]/35 blur-3xl" />
                <div className="absolute -right-6 bottom-6 h-36 w-36 rounded-full bg-[color:var(--saffron)]/20 blur-3xl" />
                <div className="relative rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_24px_60px_rgba(26,43,74,0.14)] backdrop-blur-md">
                  <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#1a2b4a,#28466f)] p-6 text-white">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Preview</p>
                    <h2 className="mt-3 font-title text-3xl">Contract risk snapshot</h2>
                    <p className="mt-3 max-w-md text-sm leading-7 text-white/80">
                      This sample agreement contains a forfeiture clause, unilateral rent changes,
                      and a landlord-selected arbitrator. Those points get flagged immediately.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {featureCards.map((card, index) => (
                      <div key={card.title} className="rounded-2xl border border-[color:var(--navy)]/10 bg-[color:var(--cream)]/80 p-4 shadow-[0_8px_20px_rgba(26,43,74,0.05)]">
                        <div className="flex items-start gap-3">
                          <div className="inline-flex size-9 items-center justify-center rounded-full bg-[color:var(--saffron)] text-sm font-bold text-white">
                            0{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-[color:var(--navy)]">{card.title}</p>
                            <p className="mt-1 text-sm leading-6 text-[color:var(--navy)]/75">{card.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PageWrap>
        </section>

        <section className="pb-20">
          <PageWrap>
            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((card) => (
                <article key={card.title} className="rounded-[1.75rem] border border-white/70 bg-white/75 p-6 shadow-[0_16px_40px_rgba(26,43,74,0.08)] backdrop-blur-sm">
                  <h3 className="font-title text-2xl text-[color:var(--navy)]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--navy)]/75">{card.text}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-[2rem] border border-[color:var(--navy)]/10 bg-[linear-gradient(135deg,rgba(26,43,74,0.96),rgba(40,70,111,0.94))] px-6 py-8 text-white shadow-[0_24px_50px_rgba(26,43,74,0.18)] md:px-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/65">Ready when you are</p>
                  <h2 className="mt-2 font-title text-3xl md:text-4xl">Paste a document and get a clear verdict.</h2>
                </div>
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--mustard)] px-6 py-3 text-sm font-semibold text-[color:var(--navy)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Open analyzer
                </Link>
              </div>
            </div>
          </PageWrap>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}