"use client";

import { useActionState, type ReactNode } from "react";
import type { AdminActionState } from "@/types/admin";

type AdminConfirmFormProps = {
  action: (
    prev: AdminActionState | null,
    formData: FormData
  ) => Promise<AdminActionState>;
  confirmMessage: string;
  hiddenFields: Record<string, string>;
  buttonLabel: string;
  buttonClassName?: string;
  children?: ReactNode;
};

export default function AdminConfirmForm({
  action,
  confirmMessage,
  hiddenFields,
  buttonLabel,
  buttonClassName = "rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40",
  children,
}: AdminConfirmFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <button type="submit" disabled={isPending} className={buttonClassName}>
        {isPending ? "..." : buttonLabel}
      </button>
      {state?.error ? <p className="mt-1 text-xs text-red-500">{state.error}</p> : null}
      {state?.success ? (
        <p className="mt-1 text-xs text-emerald-600">{state.success}</p>
      ) : null}
    </form>
  );
}
