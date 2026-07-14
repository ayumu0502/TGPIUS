"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { submitContactInquiry } from "@/app/actions/contact";
import { AuthAlert } from "@/components/auth/AuthInput";
import {
  CONTACT_INQUIRY_TYPES,
  CONTACT_SUCCESS_MESSAGE,
} from "@/lib/contact/constants";
import type { ContactFormState } from "@/lib/contact/validation";

type ContactFormProps = {
  formId?: string;
  className?: string;
};

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
    >
      {children}
      {required ? <span className="ml-1 text-[var(--gold-dark)]">*</span> : null}
    </label>
  );
}

function inputClass(hasError?: boolean) {
  return `w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgba(197,160,89,0.25)] ${
    hasError
      ? "border-red-300 focus:border-red-400"
      : "border-[var(--card-border)] focus:border-[var(--gold)]"
  }`;
}

export default function ContactForm({
  formId = "contact-form",
  className = "",
}: ContactFormProps) {
  const [state, formAction, isPending] = useActionState<
    ContactFormState | null,
    FormData
  >(submitContactInquiry, null);

  if (state?.success) {
    return (
      <div
        className={`contact-form-success rounded-3xl border border-[rgba(197,160,89,0.28)] bg-[linear-gradient(135deg,rgba(197,160,89,0.1),#ffffff_55%,#f7f8fa)] px-6 py-10 text-center sm:px-10 sm:py-12 ${className}`}
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(197,160,89,0.35)] bg-white text-[var(--gold-dark)]">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="ja-body text-base leading-relaxed text-[var(--text-primary)] sm:text-lg">
          {CONTACT_SUCCESS_MESSAGE}
        </p>
      </div>
    );
  }

  return (
    <form
      id={formId}
      action={formAction}
      className={`contact-form-card premium-card rounded-3xl p-6 sm:p-8 lg:p-10 ${className}`}
    >
      {state?.error ? (
        <div className="mb-6">
          <AuthAlert type="error" message={state.error} />
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel htmlFor={`${formId}-companyName`} required>
            会社名（法人名）
          </FieldLabel>
          <input
            id={`${formId}-companyName`}
            name="companyName"
            type="text"
            autoComplete="organization"
            placeholder="株式会社〇〇"
            className={inputClass(Boolean(state?.fieldErrors?.companyName))}
          />
          {state?.fieldErrors?.companyName ? (
            <p className="mt-2 text-sm text-red-500">{state.fieldErrors.companyName}</p>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor={`${formId}-contactName`} required>
            ご担当者様名
          </FieldLabel>
          <input
            id={`${formId}-contactName`}
            name="contactName"
            type="text"
            autoComplete="name"
            placeholder="山田 太郎"
            className={inputClass(Boolean(state?.fieldErrors?.contactName))}
          />
          {state?.fieldErrors?.contactName ? (
            <p className="mt-2 text-sm text-red-500">{state.fieldErrors.contactName}</p>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor={`${formId}-email`} required>
            メールアドレス
          </FieldLabel>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="contact@company.co.jp"
            className={inputClass(Boolean(state?.fieldErrors?.email))}
          />
          {state?.fieldErrors?.email ? (
            <p className="mt-2 text-sm text-red-500">{state.fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor={`${formId}-phone`}>電話番号</FieldLabel>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="03-1234-5678"
            className={inputClass(Boolean(state?.fieldErrors?.phone))}
          />
          {state?.fieldErrors?.phone ? (
            <p className="mt-2 text-sm text-red-500">{state.fieldErrors.phone}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor={`${formId}-inquiryType`} required>
            お問い合わせ種別
          </FieldLabel>
          <select
            id={`${formId}-inquiryType`}
            name="inquiryType"
            defaultValue=""
            className={`${inputClass(Boolean(state?.fieldErrors?.inquiryType))} appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%239e7d3c%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19.5 8.25l-7.5 7.5-7.5-7.5%27/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat pr-12`}
          >
            <option value="" disabled>
              選択してください
            </option>
            {CONTACT_INQUIRY_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.inquiryType ? (
            <p className="mt-2 text-sm text-red-500">{state.fieldErrors.inquiryType}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor={`${formId}-message`} required>
            お問い合わせ内容
          </FieldLabel>
          <textarea
            id={`${formId}-message`}
            name="message"
            rows={8}
            placeholder="ご相談内容をご記入ください"
            className={`${inputClass(Boolean(state?.fieldErrors?.message))} min-h-[180px] resize-y`}
          />
          {state?.fieldErrors?.message ? (
            <p className="mt-2 text-sm text-red-500">{state.fieldErrors.message}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <label className="flex items-start gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-4">
          <input
            type="checkbox"
            name="privacyConsent"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--card-border)] text-[var(--gold)] focus:ring-[var(--gold)]"
          />
          <span className="text-sm leading-relaxed text-[var(--text-secondary)]">
            <Link href="/privacy" className="font-medium text-[var(--gold-dark)] underline-offset-4 hover:underline">
              プライバシーポリシー
            </Link>
            に同意する
          </span>
        </label>
        {state?.fieldErrors?.privacyConsent ? (
          <p className="mt-2 text-sm text-red-500">{state.fieldErrors.privacyConsent}</p>
        ) : null}
      </div>

      <input
        type="text"
        name="companyWebsite"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <div className="mt-8">
        <button
          type="submit"
          disabled={isPending}
          className="btn-gold w-full rounded-2xl px-6 py-4 text-sm font-semibold tracking-wide transition-opacity disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
        >
          {isPending ? "送信中..." : "お問い合わせを送信"}
        </button>
      </div>
    </form>
  );
}
