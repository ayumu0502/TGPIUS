import { platformFeatures } from "@/lib/landing/data";
import ScrollReveal from "./ScrollReveal";
import {
  EventIcon,
  GiftIcon,
  MessageIcon,
  RankingIcon,
  ShieldIcon,
  SponsorIcon,
} from "./LandingIcons";

const iconMap = {
  gift: GiftIcon,
  ranking: RankingIcon,
  exclusive: MessageIcon,
  event: EventIcon,
  shield: ShieldIcon,
  sponsor: SponsorIcon,
} as const;

export default function FeaturesSection() {
  return (
    <section id="features" className="lp-features">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="lp-features__header">
            <p className="lp-features__badge">TGPLUSの特徴</p>
            <h2 className="lp-features__title ja-heading">アスリートを多角的にサポート</h2>
            <div className="lp-features__line" aria-hidden="true" />
          </div>
        </ScrollReveal>

        <div className="lp-features__grid">
          {platformFeatures.map((feature, i) => {
            const Icon = iconMap[feature.icon];
            return (
              <ScrollReveal key={feature.id} delay={i * 50}>
                <article className="lp-feature-card group">
                  <div className="lp-feature-card__icon-wrap">
                    <div className="lp-feature-card__icon">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="lp-feature-card__body">
                    <h3 className="lp-feature-card__title">{feature.title}</h3>
                    <p className="lp-feature-card__desc">{feature.description}</p>
                  </div>
                  <span className="lp-feature-card__arrow" aria-hidden="true">
                    →
                  </span>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
