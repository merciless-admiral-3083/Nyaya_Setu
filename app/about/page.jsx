import { PageWrap, SiteFooter, SiteHeader } from "../../components/SiteShell";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader compact />
      <main className="flex-1 py-12">
        <PageWrap>
          <section className="panel rounded-3xl p-8 md:p-10">
            <p className="kicker">About NyayaSetu</p>
            <h1 className="font-title mt-3 text-4xl text-[color:var(--navy)] md:text-5xl">
              न्याय सबके लिए - Justice for All
            </h1>
            <p className="mt-5 max-w-3xl leading-relaxed text-[color:var(--ink)]/85">
              NyayaSetu helps citizens decode legal documents in plain language. Instead of one
              generic answer, it runs a three-voice AI Sabha: Vakil for legal risk, Aam Aadmi for
              simple Hindi explanation, and Nyayaadheesh for final verdict with action items.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-[color:var(--navy)]/20 bg-white/70 p-4">
                <h2 className="font-title text-xl text-[color:var(--navy)]">Vakil</h2>
                <p className="mt-2 text-sm text-[color:var(--ink)]/80">Finds risky clauses, legal traps, and rights you can assert.</p>
              </article>
              <article className="rounded-2xl border border-[color:var(--navy)]/20 bg-white/70 p-4">
                <h2 className="font-title text-xl text-[color:var(--navy)]">Aam Aadmi</h2>
                <p className="font-hindi mt-2 text-sm text-[color:var(--ink)]/80">कठिन कानूनी भाषा को आसान हिंदी में समझाता है।</p>
              </article>
              <article className="rounded-2xl border border-[color:var(--navy)]/20 bg-white/70 p-4">
                <h2 className="font-title text-xl text-[color:var(--navy)]">Nyayaadheesh</h2>
                <p className="mt-2 text-sm text-[color:var(--ink)]/80">Gives risk score out of 10 and next 3 steps before you sign.</p>
              </article>
            </div>
          </section>
        </PageWrap>
      </main>
      <SiteFooter />
    </div>
  );
}
