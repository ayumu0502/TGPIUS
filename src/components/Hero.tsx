import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
      <div className="hero-gradient pointer-events-none absolute inset-0" />
      <div className="grid-pattern pointer-events-none absolute inset-0 opacity-60" />

      <div className="glow-orb pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
      <div className="glow-orb pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-white/[0.03] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 text-center lg:px-8">
        <div className="animate-fade-in-up mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          スポーツ応援プラットフォーム
        </div>

        <h1 className="animate-fade-in-up animate-delay-100 ja-heading mx-auto max-w-4xl text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="text-shimmer">応援が、チカラになる。</span>
        </h1>

        <p className="animate-fade-in-up animate-delay-200 ja-heading mx-auto mt-6 max-w-3xl text-xl font-medium text-white sm:text-2xl md:text-3xl">
          夢に向かうアスリートを、
          <br className="hidden sm:inline" />
          あなたの応援で支えよう。
        </p>

        <p className="animate-fade-in-up animate-delay-300 ja-body mx-auto mt-8 max-w-2xl text-base text-zinc-400 sm:text-lg">
          TGPLUSは、アスリート・ファン・企業スポンサーをつなぐスポーツ応援プラットフォームです。
          ギフト、メッセージ、イベントを通じて、選手の挑戦を支援できます。
        </p>

        <div className="animate-fade-in-up animate-delay-400 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="group relative w-full overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all duration-300 hover:shadow-2xl hover:shadow-white/20 sm:w-auto"
          >
            <span className="relative z-10">無料で始める</span>
          </Link>
          <a
            href="#support"
            className="w-full rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:border-white/40 hover:bg-white/5 sm:w-auto"
          >
            サービスを見る
          </a>
        </div>

        <div className="animate-fade-in-up animate-delay-500 mt-20 grid grid-cols-3 gap-6 border-t border-white/10 pt-12 sm:gap-16">
          {[
            { value: "10,000+", label: "アスリート" },
            { value: "200万+", label: "ファン" },
            { value: "500+", label: "スポンサー" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl font-bold sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-zinc-500 sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="float-element flex flex-col items-center gap-2 text-zinc-600">
          <span className="text-xs">スクロール</span>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
