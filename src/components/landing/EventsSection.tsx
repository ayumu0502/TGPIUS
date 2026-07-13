import Link from "next/link";
import { upcomingEvents } from "@/lib/landing/data";
import ScrollReveal from "./ScrollReveal";
import SectionHeader from "./SectionHeader";

function statusStyle(status: string) {
  if (status === "受付中") return "bg-[var(--landing-gold-muted)] text-[var(--landing-gold-dark)]";
  if (status === "満席") return "bg-gray-100 text-gray-600";
  return "bg-gray-100 text-gray-500";
}

export default function EventsSection() {
  return (
    <section id="events" className="landing-section bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Upcoming Events"
            title="今後のイベント"
            subtitle="オンライン・オフラインの特別な体験。アスリートと直接つながる、記憶に残る瞬間を。"
          />
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {upcomingEvents.map((event, i) => (
            <ScrollReveal key={event.id} delay={i * 80}>
              <article className="landing-card flex h-full flex-col p-7">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--landing-gold-dark)]">
                    {event.type}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <h3 className="ja-heading mt-5 text-xl font-bold text-[var(--landing-text)]">{event.title}</h3>
                <p className="mt-3 text-sm text-[var(--landing-muted)]">{event.date}</p>
                <div className="mt-auto pt-6">
                  <Link
                    href="/register"
                    className="text-sm font-semibold text-[var(--landing-gold-dark)] transition hover:text-[var(--landing-gold)]"
                  >
                    詳細を見る →
                  </Link>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
