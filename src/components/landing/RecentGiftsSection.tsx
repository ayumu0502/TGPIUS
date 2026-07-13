import { recentGifts } from "@/lib/landing/data";
import ScrollReveal from "./ScrollReveal";
import SectionHeader from "./SectionHeader";

export default function RecentGiftsSection() {
  return (
    <section id="gifts" className="landing-section bg-[var(--landing-surface)] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Recent Gifts"
            title="最近送られたギフト"
            subtitle="ファンからアスリートへ届いた、温かい想いのギフト。言葉とともに、具体的な支援が届いています。"
          />
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentGifts.map((gift, i) => (
            <ScrollReveal key={gift.id} delay={i * 80}>
              <article className="landing-card p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--landing-muted)]">From</p>
                    <p className="mt-1 font-bold text-[var(--landing-text)]">{gift.from}</p>
                  </div>
                  <span className="landing-gift-amount text-xl">{gift.amount.toLocaleString()} pt</span>
                </div>
                <p className="ja-body mt-5 text-[var(--landing-text)]">&ldquo;{gift.message}&rdquo;</p>
                <p className="mt-5 text-xs text-[var(--landing-muted)]">{gift.date}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
