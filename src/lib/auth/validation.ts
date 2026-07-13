import type { AccountType, AuthFormState } from "@/types/auth";
import { isAccountType } from "@/lib/auth/routes";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistrationInput(input: {
  name: string;
  email: string;
  password: string;
  accountType: string;
}): AuthFormState | null {
  const fieldErrors: NonNullable<AuthFormState["fieldErrors"]> = {};

  if (!input.name.trim()) {
    fieldErrors.name = "お名前を入力してください";
  } else if (input.name.trim().length < 2) {
    fieldErrors.name = "お名前は2文字以上で入力してください";
  }

  if (!input.email.trim()) {
    fieldErrors.email = "メールアドレスを入力してください";
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    fieldErrors.email = "有効なメールアドレスを入力してください";
  }

  if (!input.password) {
    fieldErrors.password = "パスワードを入力してください";
  } else if (input.password.length < 8) {
    fieldErrors.password = "パスワードは8文字以上で入力してください";
  }

  if (!isAccountType(input.accountType)) {
    fieldErrors.accountType = "アカウントタイプを選択してください";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

export function validateLoginInput(input: {
  email: string;
  password: string;
}): AuthFormState | null {
  const fieldErrors: NonNullable<AuthFormState["fieldErrors"]> = {};

  if (!input.email.trim()) {
    fieldErrors.email = "メールアドレスを入力してください";
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    fieldErrors.email = "有効なメールアドレスを入力してください";
  }

  if (!input.password) {
    fieldErrors.password = "パスワードを入力してください";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

export function parseAccountType(value: string): AccountType | null {
  return isAccountType(value) ? value : null;
}
