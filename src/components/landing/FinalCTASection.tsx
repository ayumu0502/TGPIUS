import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

export default function FinalCTASection() {
  return (
    <section id="register" className="landing-section landing-final-cta relative overflow-hidden py-24 lg:py-32">
      <div className="landing-final-cta-bg" aria-hidden="true">
        <div className="landing-final-cta-glow" />
        <div className="landing-final-cta-lines" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="landing-final-cta-card px-8 py-16 text-center sm:px-12 sm:py-20 lg:px-20 lg:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--landing-gold-dark)]">
              Get Started
            </p>
            <h2 className="ja-heading mt-6 text-3xl font-bold text-[var(--landing-text)] sm:text-4xl lg:text-5xl">
              応援を、はじめよう。
            </h2>
            <p className="ja-body mx-auto mt-6 max-w-xl text-base text-[var(--landing-muted)] sm:text-lg">
              アスリート、ファン、企業スポンサー——
              どなたでも無料でアカウントを作成できます。
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="landing-btn-primary w-full min-w-[200px] sm:w-auto">
                無料で始める
              </Link>
              <Link href="/login" className="landing-btn-outline w-full min-w-[200px] sm:w-auto">
                ログイン
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
