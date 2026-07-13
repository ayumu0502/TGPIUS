import { landingStats } from "@/lib/landing/data";
import ScrollReveal from "./ScrollReveal";
import { AthleteStatIcon, GiftStatIcon, PointsStatIcon, SupporterStatIcon } from "./LandingIcons";

const iconMap = {
  athlete: AthleteStatIcon,
  gift: GiftStatIcon,
  points: PointsStatIcon,
  supporter: SupporterStatIcon,
} as const;

export default function LandingStatsBar() {
  return (
    <section className="lp-stats-section" aria-label="プラットフォーム統計">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="lp-stats-grid">
            {landingStats.map((stat, i) => {
              const Icon = iconMap[stat.icon];
              return (
                <div key={stat.id} className="lp-stat-card" style={{ transitionDelay: `${i * 60}ms` }}>
                  <div className="lp-stat-card__icon">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="lp-stat-card__label">{stat.label}</p>
                  <p className="lp-stat-card__value">
                    {stat.value}
                    {stat.unit && <span className="lp-stat-card__unit">{stat.unit}</span>}
                  </p>
                  {stat.sublabel && <p className="lp-stat-card__sublabel">{stat.sublabel}</p>}
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
