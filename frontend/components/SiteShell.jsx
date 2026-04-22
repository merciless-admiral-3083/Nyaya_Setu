import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/app", label: "Analyse" },
  { href: "/account", label: "Account" },
  { href: "/results", label: "Results" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ compact = false }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/25 bg-[color:var(--navy)]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-[color:var(--saffron)] text-xl shadow-[0_6px_18px_rgba(232,118,45,0.35)] transition-transform duration-300 group-hover:-rotate-6">
            ⚖
          </span>
          <div>
            <p className="font-title text-xl leading-none text-[color:var(--cream)]">NyayaSetu</p>
            <p className="text-xs text-[color:var(--mustard)]">न्याय सेतु · Justice for All</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm tracking-wide text-[color:var(--cream)]/90 transition-colors duration-200 hover:text-[color:var(--mustard)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/app"
            className="rounded-full bg-[color:var(--saffron)] px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Start Analysis
          </Link>
        </nav>

        <Link
          href="/app"
          className="rounded-full bg-[color:var(--saffron)] px-3 py-1.5 text-xs font-semibold text-white md:hidden"
        >
          Analyse
        </Link>
      </div>
      {!compact ? <div className="h-[2px] w-full bg-[linear-gradient(90deg,var(--mustard),var(--saffron),transparent)]" /> : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[color:var(--navy)]/20 bg-[color:var(--cream)]/70 px-4 py-10 backdrop-blur-sm md:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-title text-2xl text-[color:var(--navy)]">NyayaSetu</p>
          <p className="text-sm text-[color:var(--navy)]/70">90% of Indians sign documents they cannot understand. We fix that.</p>
        </div>
        <div className="text-sm text-[color:var(--navy)]/80">
          <p>AI-powered legal aid for every Indian.</p>
          <p>न्याय सबके लिए · Justice for All</p>
        </div>
      </div>
    </footer>
  );
}

export function PageWrap({ children }) {
  return <div className="mx-auto w-full max-w-6xl px-4 md:px-6">{children}</div>;
}