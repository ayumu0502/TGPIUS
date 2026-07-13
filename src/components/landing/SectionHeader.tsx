type SectionHeaderProps = {
  badge: string;
  title: string;
  subtitle: string;
  centered?: boolean;
};

export default function SectionHeader({
  badge,
  title,
  subtitle,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={`mb-14 lg:mb-16 ${centered ? "mx-auto max-w-2xl text-center" : "max-w-xl"}`}>
      <span className="landing-badge">{badge}</span>
      <h2 className="ja-heading mt-5 text-3xl font-bold text-[var(--landing-text)] sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      <p className="ja-body mt-5 text-base text-[var(--landing-muted)] sm:text-lg">{subtitle}</p>
    </div>
  );
}
