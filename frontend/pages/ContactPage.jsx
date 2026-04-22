import { PageWrap, SiteFooter, SiteHeader } from "../components/SiteShell";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader compact />
      <main className="flex-1 py-10 md:py-14">
        <PageWrap>
          <section className="panel rounded-3xl p-6 md:p-8">
            <p className="kicker">Contact</p>
            <h1 className="font-title mt-2 text-4xl text-[color:var(--navy)] md:text-5xl">We are listening</h1>
            <p className="mt-4 max-w-3xl text-[color:var(--ink)]/85">
              Share bugs, language improvements, or legal workflow suggestions. We prioritize feedback that improves
              trust, clarity, and accessibility for first-time users.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--navy)]/15 bg-white p-4">
                <p className="text-sm font-semibold text-[color:var(--navy)]">Email</p>
                <p className="mt-1 text-sm text-[color:var(--ink)]/80">support@nyayasetu.in</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--navy)]/15 bg-white p-4">
                <p className="text-sm font-semibold text-[color:var(--navy)]">Hours</p>
                <p className="mt-1 text-sm text-[color:var(--ink)]/80">Mon-Sat, 10:00 AM - 7:00 PM (IST)</p>
              </div>
            </div>
          </section>
        </PageWrap>
      </main>
      <SiteFooter />
    </div>
  );
}
