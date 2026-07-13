"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import {
  mapProfileRow,
  PROFILE_EXTENDED_SELECT,
  PROFILE_SELECT,
  type ProfileEditState,
  type PublicProfile,
} from "@/types/profile";

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function isValidUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function getPublicProfile(
  userId: string
): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .single();

  if (error || !profile) return null;

  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: extended } = await supabase
    .from("profiles")
    .select(PROFILE_EXTENDED_SELECT)
    .eq("id", userId)
    .maybeSingle();

  return mapProfileRow(
    extended ? { ...profile, ...extended } : profile,
    count ?? 0
  );
}

export async function updateAthleteProfile(
  _prevState: ProfileEditState | null,
  formData: FormData
): Promise<ProfileEditState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };
  if (current.account_type !== "athlete") {
    return { error: "アスリートアカウントのみ編集できます" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const sport = String(formData.get("sport") ?? "").trim();
  const team = String(formData.get("team") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const achievements = String(formData.get("achievements") ?? "").trim();
  const goals = String(formData.get("goals") ?? "").trim();
  const instagramUrl = String(formData.get("instagram_url") ?? "").trim();
  const tiktokUrl = String(formData.get("tiktok_url") ?? "").trim();
  const xUrl = String(formData.get("x_url") ?? "").trim();
  const avatarFile = formData.get("avatar") as File | null;

  const fieldErrors: ProfileEditState["fieldErrors"] = {};

  if (!name) fieldErrors.name = "名前を入力してください";
  if (name.length > 50) fieldErrors.name = "名前は50文字以内にしてください";
  if (!sport) fieldErrors.sport = "競技を入力してください";
  if (bio.length > 500) fieldErrors.bio = "自己紹介は500文字以内にしてください";
  if (achievements.length > 500) {
    fieldErrors.achievements = "実績は500文字以内にしてください";
  }
  if (goals.length > 500) fieldErrors.goals = "目標は500文字以内にしてください";

  for (const [key, url] of [
    ["instagram_url", instagramUrl],
    ["tiktok_url", tiktokUrl],
    ["x_url", xUrl],
  ] as const) {
    if (!isValidUrl(url)) {
      fieldErrors[key] = "有効なURLを入力してください";
    }
  }

  if (avatarFile && avatarFile.size > 0) {
    if (!AVATAR_TYPES.includes(avatarFile.type)) {
      fieldErrors.avatar = "JPEG, PNG, WebP, GIF のみ対応しています";
    }
    if (avatarFile.size > MAX_AVATAR_SIZE) {
      fieldErrors.avatar = "画像は5MB以下にしてください";
    }
  }

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  let avatarUrl: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${current.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: avatarFile.type,
      });

    if (uploadError) {
      return { error: "プロフィール写真のアップロードに失敗しました" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    avatarUrl = `${publicUrl}?t=${Date.now()}`;
  }

  const updateData: Record<string, string> = {
    name,
    sport,
    team,
    region,
    bio,
    achievements,
    goals,
    instagram_url: instagramUrl,
    tiktok_url: tiktokUrl,
    x_url: xUrl,
    updated_at: new Date().toISOString(),
  };

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", current.id);

  if (error) {
    return { error: "プロフィールの保存に失敗しました" };
  }

  revalidatePath(`/profile/${current.id}`);
  revalidatePath("/athlete/profile/edit");
  revalidatePath("/athlete/dashboard");
  revalidatePath("/feed");

  return { success: "プロフィールを保存しました" };
}
