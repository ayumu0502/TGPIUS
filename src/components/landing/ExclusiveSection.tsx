import { exclusiveContent } from "@/lib/landing/data";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeader from "./SectionHeader";

const typeIcons: Record<string, string> = {
  動画: "▶",
  写真: "◻",
  ライブ: "●",
};

export default function ExclusiveSection() {
  return (
    <section id="exclusive" className="landing-section bg-[var(--landing-surface)] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Exclusive"
            title="限定コンテンツ紹介"
            subtitle="会員だけがアクセスできる、特別な裏側。試合前のルーティンから、トレーニングの真実まで。"
          />
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exclusiveContent.map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 80}>
              <article className="landing-card group relative min-h-[280px] overflow-hidden border border-[var(--landing-border)] bg-white">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(197,160,89,0.08)_0%,transparent_55%)]" />
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[rgba(197,160,89,0.12)] blur-2xl" />
                <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--landing-gold)]/30 to-transparent" />
                <div className="relative flex h-full flex-col justify-between p-7">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex w-fit rounded-full border border-[var(--landing-gold)]/30 bg-[rgba(197,160,89,0.1)] px-3 py-1 text-xs font-semibold text-[var(--landing-gold-dark)]">
                      {item.badge}
                    </span>
                    <span className="text-2xl text-[var(--landing-gold)]">{typeIcons[item.type]}</span>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-[var(--landing-text-muted)]">
                      <span className="h-px w-6 bg-[var(--landing-gold)]/40" />
                      <span>{item.type}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--landing-text)]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[var(--landing-text-muted)]">{item.athlete}</p>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
