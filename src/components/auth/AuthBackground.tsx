import Link from "next/link";

export default function AuthBackground() {
  return (
    <>
      <div className="hero-gradient pointer-events-none absolute inset-0" />
      <div className="grid-pattern pointer-events-none absolute inset-0 opacity-40" />
      <div className="glow-orb pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
    </>
  );
}

export function AuthLogo({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const textClass = theme === "light" ? "text-[var(--text-primary)]" : "text-white";

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2 text-xl font-bold tracking-tight ${textClass}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] text-sm font-black text-white transition-transform duration-300 group-hover:scale-105">
        T+
      </span>
      <span>TGPLUS</span>
    </Link>
  );
}
