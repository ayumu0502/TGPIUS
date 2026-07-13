"use client";

import { useState } from "react";
import { landingFaqItems } from "@/lib/landing/faq";
import ScrollReveal from "./ScrollReveal";

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>("1");

  return (
    <section id="faq" className="landing-section bg-[var(--landing-surface)] py-16 lg:py-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="ja-heading text-3xl font-bold text-[var(--landing-text)] sm:text-4xl">
              よくある質問
            </h2>
            <p className="ja-body mt-3 text-sm text-[var(--landing-muted)]">
              ご利用前に知っておきたいことをまとめました
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 space-y-3">
          {landingFaqItems.map((item, i) => {
            const isOpen = openId === item.id;
            return (
              <ScrollReveal key={item.id} delay={i * 50}>
                <div className="overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-white shadow-sm">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-bold text-[var(--landing-text)] sm:text-base">
                      {item.question}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--landing-border)] text-[var(--landing-gold-dark)] transition-transform duration-300 ${isOpen ? "rotate-45 bg-[rgba(197,160,89,0.08)]" : ""}`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="ja-body border-t border-[var(--landing-border)] px-5 pb-4 pt-3 text-sm leading-relaxed text-[var(--landing-muted)]">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
