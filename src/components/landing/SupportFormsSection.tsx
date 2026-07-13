"use client";

import Image from "next/image";
import { useRef } from "react";
import { supportFormScenes } from "@/lib/landing/data";
import { landingSupportImages } from "@/lib/landing/images";
import ScrollReveal from "./ScrollReveal";

function SceneIcon({ variant }: { variant: string }) {
  if (variant === "stadium") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" d="M4 18h16M6 14l2-8h8l2 8M9 6V4h6v2" />
      </svg>
    );
  }
  if (variant === "court") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="4" y="6" width="16" height="12" rx="1" />
        <path d="M12 6v12" />
      </svg>
    );
  }
  if (variant === "track") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <ellipse cx="12" cy="12" rx="8" ry="5" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" d="M3 14h18M3 18h18" />
    </svg>
  );
}

export default function SupportFormsSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    trackRef.current?.scrollBy({ left: 340, behavior: "smooth" });
  };

  return (
    <section id="support-forms" className="landing-section bg-white pb-16 pt-4 lg:pb-20 lg:pt-6">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-2xl text-left">
            <h2 className="ja-heading text-3xl font-bold text-[var(--landing-text)] sm:text-4xl lg:text-[2.75rem]">
              応援のカタチは
              <span className="lp-accent-gold">自由</span>
            </h2>
            <p className="ja-body mt-3 text-sm text-[var(--landing-muted)] sm:text-base">
              あなたの応援が、アスリートの未来を変える。
            </p>
          </div>
        </ScrollReveal>

        <div className="lp-support-carousel mt-10">
          <div ref={trackRef} className="lp-support-track">
            {supportFormScenes.map((scene, i) => (
              <ScrollReveal key={scene.id} delay={i * 70}>
                <article className="lp-support-card group">
                  <div className="lp-support-media">
                    <Image
                      src={landingSupportImages[scene.variant]}
                      alt={scene.label}
                      fill
                      sizes="(min-width: 1024px) 280px, 78vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="lp-support-media__overlay" />
                  </div>
                  <div className="lp-support-footer">
                    <span className="lp-support-footer-icon">
                      <SceneIcon variant={scene.variant} />
                    </span>
                    <span className="lp-support-footer-text">{scene.caption}</span>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
          <button type="button" className="lp-support-arrow" aria-label="次のカード" onClick={scrollNext}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
