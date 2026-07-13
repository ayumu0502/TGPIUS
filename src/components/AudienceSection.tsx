import type { ReactNode } from "react";

type Feature = {
  title: string;
  description: string;
};

type AudienceSectionProps = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  features: Feature[];
  reversed?: boolean;
  icon: ReactNode;
};

export default function AudienceSection({
  id,
  badge,
  title,
  subtitle,
  features,
  reversed = false,
  icon,
}: AudienceSectionProps) {
  return (
    <section
      id={id}
      className="relative scroll-mt-24 border-t border-white/5 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className={`grid items-center gap-16 lg:grid-cols-2 ${
            reversed ? "lg:[direction:rtl]" : ""
          }`}
        >
          <div className={reversed ? "lg:[direction:ltr]" : ""}>
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-400">
              {badge}
            </span>
            <h2 className="ja-heading mt-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="ja-body mt-6 text-base text-zinc-400 sm:text-lg">
              {subtitle}
            </p>
            <ul className="mt-10 space-y-6">
              {features.map((feature) => (
                <li key={feature.title} className="flex gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs">
                    ✓
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="ja-body mt-1 text-sm text-zinc-500">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`card-hover relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-8 lg:p-12 ${
              reversed ? "lg:[direction:ltr]" : ""
            }`}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative flex flex-col items-center justify-center py-12">
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                {icon}
              </div>
              <div className="grid w-full gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/50 p-4"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-white/20 to-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 w-3/4 rounded-full bg-white/10" />
                      <div className="h-2 w-1/2 rounded-full bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
