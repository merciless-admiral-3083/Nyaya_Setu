import { PageWrap, SiteFooter, SiteHeader } from "../components/SiteShell";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader compact />
      <main className="flex-1 py-10 md:py-14">
        <PageWrap>
          <section className="panel rounded-3xl p-6 md:p-8">
            <p className="kicker">About NyayaSetu</p>
            <h1 className="font-title mt-2 text-4xl text-[color:var(--navy)] md:text-5xl">Legal understanding for everyone</h1>
            <p className="mt-4 max-w-3xl text-[color:var(--ink)]/85">
              NyayaSetu helps people read legal documents in plain language before signing. Our AI Sabha presents
              document risks from three viewpoints so users can make safer decisions.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[color:var(--navy)]/15 bg-white p-4">
                <h2 className="font-title text-xl text-[color:var(--navy)]">Vakil</h2>
                <p className="mt-2 text-sm text-[color:var(--ink)]/80">Flags legal risks and explains why they matter.</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--navy)]/15 bg-white p-4">
                <h2 className="font-title text-xl text-[color:var(--navy)]">Aam Aadmi</h2>
                <p className="mt-2 text-sm text-[color:var(--ink)]/80">Translates complex legal text into simple Hindi.</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--navy)]/15 bg-white p-4">
                <h2 className="font-title text-xl text-[color:var(--navy)]">Nyayaadheesh</h2>
                <p className="mt-2 text-sm text-[color:var(--ink)]/80">Gives a final verdict with practical next steps.</p>
              </div>
            </div>
          </section>
        </PageWrap>
      </main>
      <SiteFooter />
    </div>
  );
}
