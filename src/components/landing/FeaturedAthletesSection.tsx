import Link from "next/link";
import { featuredAthletes } from "@/lib/landing/data";
import ScrollReveal from "./ScrollReveal";
import SectionHeader from "./SectionHeader";

export default function FeaturedAthletesSection() {
  return (
    <section id="athletes" className="landing-section bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Featured Athletes"
            title="注目アスリート"
            subtitle="今、最も熱い応援を集める選手たち。プロフィールをフォローして、日々の挑戦に寄り添いましょう。"
          />
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredAthletes.map((athlete, i) => (
            <ScrollReveal key={athlete.id} delay={i * 80}>
              <Link href={`/profile/${athlete.id}`} className="landing-card group block overflow-hidden p-6">
                <div className="landing-avatar mb-5 h-16 w-16 text-xl">{athlete.avatarInitial}</div>
                <h3 className="text-lg font-bold text-[var(--landing-text)] group-hover:text-[var(--landing-gold-dark)]">
                  {athlete.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--landing-muted)]">{athlete.sport}</p>
                <div className="mt-5 flex items-center justify-between border-t border-[var(--landing-border)] pt-4">
                  <span className="text-xs font-medium text-[var(--landing-muted)]">フォロワー</span>
                  <span className="text-sm font-bold text-[var(--landing-gold-dark)]">{athlete.followers}</span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
