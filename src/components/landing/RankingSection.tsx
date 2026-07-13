import { liveRanking } from "@/lib/landing/data";
import ScrollReveal from "./ScrollReveal";
import SectionHeader from "./SectionHeader";
import { sportIcon } from "./LandingIcons";

function rankClass(rank: number) {
  if (rank === 1) return "landing-rank-1";
  if (rank === 2) return "landing-rank-2";
  if (rank === 3) return "landing-rank-3";
  return "landing-rank-default";
}

function trendIcon(trend: "up" | "down" | "same") {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "—";
}

export default function RankingSection() {
  return (
    <section id="ranking" className="landing-section bg-[var(--landing-surface)] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Live Ranking"
            title="リアルタイム応援ランキング"
            subtitle="今この瞬間、最も熱い応援を集めているアスリート。ギフト・メッセージ・エンゲージメントがリアルタイムで反映されます。"
          />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="landing-card overflow-hidden">
            <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] items-center gap-6 border-b border-[var(--landing-border)] bg-[var(--landing-surface)] px-8 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--landing-muted)] lg:grid">
              <span>順位</span>
              <span>アスリート</span>
              <span>競技</span>
              <span>応援ポイント</span>
              <span>前日比</span>
            </div>

            <ul>
              {liveRanking.map((entry, i) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-4 border-b border-[var(--landing-border)] px-6 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between lg:grid lg:grid-cols-[auto_1fr_auto_auto_auto] lg:gap-6 lg:px-8"
                >
                  <div className={`landing-rank-badge ${rankClass(entry.rank)}`}>{entry.rank}</div>

                  <div className="flex items-center gap-4">
                    <div className="landing-sport-icon">{sportIcon(entry.sport, "h-5 w-5")}</div>
                    <div>
                      <p className="font-bold text-[var(--landing-text)]">{entry.name}</p>
                      <p className="text-sm text-[var(--landing-muted)] lg:hidden">{entry.sport}</p>
                    </div>
                  </div>

                  <span className="hidden text-sm text-[var(--landing-muted)] lg:block">{entry.sport}</span>

                  <span className="text-lg font-bold text-[var(--landing-gold-dark)]">
                    {entry.points.toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-[var(--landing-muted)]">pt</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 text-sm font-semibold ${
                      entry.trend === "up"
                        ? "text-emerald-600"
                        : entry.trend === "down"
                          ? "text-red-500"
                          : "text-[var(--landing-muted)]"
                    }`}
                  >
                    {trendIcon(entry.trend)} {entry.change}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
