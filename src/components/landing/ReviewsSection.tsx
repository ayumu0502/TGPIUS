import { reviews } from "@/lib/landing/data";
import ScrollReveal from "./ScrollReveal";
import SectionHeader from "./SectionHeader";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="landing-star text-lg">
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  return (
    <section id="reviews" className="landing-section bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Reviews"
            title="利用者レビュー"
            subtitle="アスリート、ファン、企業——TGPLUSを使うすべての人の声。"
          />
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <ScrollReveal key={review.id} delay={i * 80}>
              <article className="landing-card flex h-full flex-col p-8">
                <Stars count={review.rating} />
                <p className="ja-body mt-6 flex-1 text-[var(--landing-text)]">&ldquo;{review.quote}&rdquo;</p>
                <div className="mt-8 border-t border-[var(--landing-border)] pt-6">
                  <p className="font-bold text-[var(--landing-text)]">{review.name}</p>
                  <p className="mt-1 text-sm text-[var(--landing-muted)]">{review.role}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
