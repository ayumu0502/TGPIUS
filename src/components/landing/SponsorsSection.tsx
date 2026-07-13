import { sponsors } from "@/lib/landing/data";
import ScrollReveal from "./ScrollReveal";
import SectionHeader from "./SectionHeader";

export default function SponsorsSection() {
  return (
    <section id="sponsors" className="landing-section bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Partners"
            title="スポンサー企業一覧"
            subtitle="TGPLUSと共にアスリートの挑戦を支える、信頼のパートナー企業。ブランド価値とスポーツの力を融合させます。"
          />
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
          {sponsors.map((sponsor, i) => (
            <ScrollReveal key={sponsor.id} delay={i * 60}>
              <div className="landing-sponsor-logo flex-col gap-1 px-4 py-6">
                <span>{sponsor.name}</span>
                <span className="text-[10px] font-normal tracking-normal text-[var(--landing-muted)]">
                  {sponsor.category}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
