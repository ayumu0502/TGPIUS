"use client";

type BackButtonProps = {
  className?: string;
  /** Screen-reader / aria label */
  label?: string;
  showLabel?: boolean;
};

export default function BackButton({
  className = "",
  label = "前のページへ戻る",
  showLabel = false,
}: BackButtonProps) {
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "/";
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-white px-2.5 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[rgba(197,160,89,0.4)] hover:bg-[rgba(197,160,89,0.08)] hover:text-[var(--gold-dark)] ${className}`}
    >
      <svg
        className="h-5 w-5 text-[var(--gold-dark)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      {showLabel ? (
        <span className="hidden max-w-[8rem] truncate sm:inline md:max-w-none">{label}</span>
      ) : null}
    </button>
  );
}
