import type { InputHTMLAttributes } from "react";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export default function AuthInput({ label, id, error, ...props }: AuthInputProps) {
  const inputId = id ?? props.name;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/25 ${
          error
            ? "border-red-400 focus:border-red-400"
            : "border-[var(--card-border)] focus:border-[var(--gold)]"
        }`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-2 text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthAlert({ type, message }: { type: "error" | "success"; message: string }) {
  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm ${
        type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[rgba(197,160,89,0.3)] bg-[rgba(197,160,89,0.08)] text-[var(--gold-dark)]"
      }`}
    >
      {message}
    </div>
  );
}
