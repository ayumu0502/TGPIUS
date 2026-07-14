"use server";

import { redirect } from "next/navigation";
import { translateAuthError } from "@/lib/auth/errors";
import { resolvePostLoginRedirect } from "@/lib/auth/admin-access";
import {
  getAccountTypeFromMetadata,
  getDashboardPath,
} from "@/lib/auth/routes";
import {
  parseAccountType,
  validateLoginInput,
  validateRegistrationInput,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import type { AccountType, AuthFormState, Profile } from "@/types/auth";

async function saveProfile(
  userId: string,
  name: string,
  email: string,
  accountType: AccountType
) {
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      name,
      email,
      account_type: accountType,
      athlete_review_status:
        accountType === "athlete" ? ("not_applied" as const) : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  return error;
}

export async function register(
  _prevState: AuthFormState | null,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const accountTypeValue = String(formData.get("accountType") ?? "fan");

  const validationError = validateRegistrationInput({
    name,
    email,
    password,
    accountType: accountTypeValue,
  });

  if (validationError) {
    return validationError;
  }

  const accountType = parseAccountType(accountTypeValue);

  if (!accountType) {
    return {
      fieldErrors: { accountType: "アカウントタイプを選択してください" },
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name.trim(),
        account_type: accountType,
      },
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  if (!data.user) {
    return { error: "アカウントの作成に失敗しました。もう一度お試しください" };
  }

  if (data.session) {
    const profileError = await saveProfile(
      data.user.id,
      name.trim(),
      email,
      accountType
    );

    if (profileError) {
      return { error: translateAuthError(profileError.message) };
    }

    if (accountType === "athlete") {
      redirect("/athlete/apply");
    }

    redirect(getDashboardPath(accountType));
  }

  return {
    success:
      accountType === "athlete"
        ? "確認メールを送信しました。メール内のリンクをクリックして登録を完了し、選手申請を行ってください。"
        : "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
  };
}

export async function login(
  _prevState: AuthFormState | null,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");

  const validationError = validateLoginInput({ email, password });

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  const accountType = getAccountTypeFromMetadata(data.user.user_metadata);

  if (!accountType) {
    return {
      error:
        "アカウント情報が見つかりません。管理者にお問い合わせください",
    };
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("is_admin, athlete_review_status")
    .eq("id", data.user.id)
    .single();

  redirect(
    resolvePostLoginRedirect(
      redirectTo,
      accountType,
      profileRow?.athlete_review_status
    )
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, name, email, account_type, created_at, updated_at, is_admin, is_suspended, athlete_review_status"
    )
    .eq("id", user.id)
    .single();

  if (profile) {
    return profile;
  }

  const accountType = getAccountTypeFromMetadata(user.user_metadata);

  if (!accountType) {
    return null;
  }

  return {
    id: user.id,
    name: String(user.user_metadata.name ?? ""),
    email: user.email ?? "",
    account_type: accountType,
    created_at: user.created_at,
    updated_at: user.updated_at ?? user.created_at,
    is_admin: false,
    is_suspended: false,
  };
}
