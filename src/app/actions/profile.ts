"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { canEditOwnAthleteProfile, canViewAthleteProfile } from "@/lib/athlete/visibility";
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
    .select(`${PROFILE_SELECT}, athlete_review_status, is_profile_public, invited_via_provisional_id`)
    .eq("id", userId)
    .single();

  if (error || !profile) return null;

  const current = await getCurrentProfile();

  if (
    profile.account_type === "athlete" &&
    !canViewAthleteProfile(
      {
        id: userId,
        account_type: profile.account_type,
        athlete_review_status: profile.athlete_review_status,
        is_profile_public: profile.is_profile_public,
      },
      current?.id ?? null,
      current?.is_admin === true
    )
  ) {
    return null;
  }

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
  if (!canEditOwnAthleteProfile(current)) {
    return { error: "プロフィールを編集する権限がありません" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const sport = String(formData.get("sport") ?? "").trim();
  const team = String(formData.get("team") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const achievements = String(formData.get("achievements") ?? "").trim();
  const goals = String(formData.get("goals") ?? "").trim();
  const careerHistory = String(formData.get("career_history") ?? "").trim();
  const instagramUrl = String(formData.get("instagram_url") ?? "").trim();
  const tiktokUrl = String(formData.get("tiktok_url") ?? "").trim();
  const xUrl = String(formData.get("x_url") ?? "").trim();
  const avatarFile = formData.get("avatar") as File | null;
  const coverFile = formData.get("cover") as File | null;

  const fieldErrors: ProfileEditState["fieldErrors"] = {};

  if (!name) fieldErrors.name = "名前を入力してください";
  if (name.length > 50) fieldErrors.name = "名前は50文字以内にしてください";
  if (!sport) fieldErrors.sport = "競技を入力してください";
  if (bio.length > 500) fieldErrors.bio = "自己紹介は500文字以内にしてください";
  if (achievements.length > 500) {
    fieldErrors.achievements = "実績は500文字以内にしてください";
  }
  if (goals.length > 500) fieldErrors.goals = "目標は500文字以内にしてください";
  if (careerHistory.length > 2000) {
    fieldErrors.career_history = "経歴は2000文字以内にしてください";
  }

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

  if (coverFile && coverFile.size > 0) {
    if (!AVATAR_TYPES.includes(coverFile.type)) {
      fieldErrors.cover = "JPEG, PNG, WebP, GIF のみ対応しています";
    }
    if (coverFile.size > MAX_AVATAR_SIZE) {
      fieldErrors.cover = "画像は5MB以下にしてください";
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

  let coverUrl: string | undefined;
  if (coverFile && coverFile.size > 0) {
    const ext = coverFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${current.id}/cover.${ext}`;

    const { error: coverUploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, coverFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: coverFile.type,
      });

    if (coverUploadError) {
      return { error: "カバー画像のアップロードに失敗しました" };
    }

    const {
      data: { publicUrl: coverPublicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    coverUrl = `${coverPublicUrl}?t=${Date.now()}`;
  }

  const updateData: Record<string, string> = {
    name,
    sport,
    team,
    region,
    bio,
    achievements,
    goals,
    career_history: careerHistory,
    instagram_url: instagramUrl,
    tiktok_url: tiktokUrl,
    x_url: xUrl,
    updated_at: new Date().toISOString(),
  };

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl;
  }
  if (coverUrl) {
    updateData.cover_url = coverUrl;
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
