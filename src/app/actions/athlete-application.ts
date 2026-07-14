"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { requireAthleteApplicant } from "@/app/actions/athlete-access";
import { canSubmitAthleteApplication } from "@/lib/athlete/status";
import { createClient } from "@/lib/supabase/server";
import {
  mapAthleteApplicationRow,
  type AthleteApplication,
  type AthleteApplicationFormState,
} from "@/types/athlete-application";

const APPLICATION_ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "ログインが必要です",
  NOT_ATHLETE_ACCOUNT: "アスリートアカウントのみ申請できます",
  APPLICATION_NOT_ALLOWED: "現在は申請を提出できません",
  FULL_NAME_REQUIRED: "氏名を入力してください",
  SPORT_REQUIRED: "競技を入力してください",
  IDENTITY_DOC_REQUIRED: "本人確認書類をアップロードしてください",
  INVALID_IDENTITY_DOC_PATH: "本人確認書類のアップロードに失敗しました",
};

function translateApplicationError(message: string): string {
  for (const [code, text] of Object.entries(APPLICATION_ERROR_MESSAGES)) {
    if (message.includes(code)) return text;
  }
  if (
    message.includes("submit_athlete_application") ||
    message.includes("could not find the function")
  ) {
    return "Supabase で athlete-application-schema.sql が未実行です。SQL Editor から実行してください";
  }
  return "申請の送信に失敗しました";
}

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const IDENTITY_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MAX_IDENTITY_SIZE = 10 * 1024 * 1024;

function isValidUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function getMyAthleteApplication(): Promise<AthleteApplication | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.account_type !== "athlete") return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_applications")
    .select(
      "id, user_id, full_name, sport, team, region, career_history, achievements, bio, instagram_url, tiktok_url, x_url, profile_image_url, status, review_note, reviewed_by, reviewed_at, submitted_at, created_at, updated_at"
    )
    .eq("user_id", profile.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapAthleteApplicationRow(data);
}

export async function submitAthleteApplication(
  _prevState: AthleteApplicationFormState | null,
  formData: FormData
): Promise<AthleteApplicationFormState> {
  const profile = await requireAthleteApplicant();

  if (!canSubmitAthleteApplication(profile.athlete_review_status)) {
    return { error: "現在は申請を提出できません。審査状況をご確認ください。" };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const sport = String(formData.get("sport") ?? "").trim();
  const team = String(formData.get("team") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const careerHistory = String(formData.get("career_history") ?? "").trim();
  const achievements = String(formData.get("achievements") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const instagramUrl = String(formData.get("instagram_url") ?? "").trim();
  const tiktokUrl = String(formData.get("tiktok_url") ?? "").trim();
  const xUrl = String(formData.get("x_url") ?? "").trim();
  const profileImage = formData.get("profile_image") as File | null;
  const identityDoc = formData.get("identity_doc") as File | null;

  const fieldErrors: AthleteApplicationFormState["fieldErrors"] = {};

  if (!fullName) fieldErrors.full_name = "氏名を入力してください";
  if (fullName.length > 50) fieldErrors.full_name = "氏名は50文字以内にしてください";
  if (!sport) fieldErrors.sport = "競技を入力してください";
  if (bio.length > 1000) fieldErrors.bio = "自己紹介は1000文字以内にしてください";
  if (careerHistory.length > 1000) {
    fieldErrors.career_history = "経歴は1000文字以内にしてください";
  }
  if (achievements.length > 1000) {
    fieldErrors.achievements = "実績は1000文字以内にしてください";
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

  if (!identityDoc || identityDoc.size === 0) {
    fieldErrors.identity_doc = "本人確認書類をアップロードしてください";
  } else {
    if (!IDENTITY_TYPES.includes(identityDoc.type)) {
      fieldErrors.identity_doc = "JPEG, PNG, WebP, PDF のみ対応しています";
    }
    if (identityDoc.size > MAX_IDENTITY_SIZE) {
      fieldErrors.identity_doc = "ファイルは10MB以下にしてください";
    }
  }

  if (profileImage && profileImage.size > 0) {
    if (!AVATAR_TYPES.includes(profileImage.type)) {
      fieldErrors.profile_image = "JPEG, PNG, WebP, GIF のみ対応しています";
    }
    if (profileImage.size > MAX_AVATAR_SIZE) {
      fieldErrors.profile_image = "画像は5MB以下にしてください";
    }
  }

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  let profileImageUrl: string | null = null;
  let identityDocPath = "";

  if (identityDoc && identityDoc.size > 0) {
    const ext = identityDoc.name.split(".").pop()?.toLowerCase() ?? "bin";
    identityDocPath = `${profile.id}/identity-${Date.now()}.${ext}`;

    const { error: docError } = await supabase.storage
      .from("athlete-identity-docs")
      .upload(identityDocPath, identityDoc, {
        cacheControl: "3600",
        upsert: false,
        contentType: identityDoc.type,
      });

    if (docError) {
      return { error: "本人確認書類のアップロードに失敗しました" };
    }
  }

  if (profileImage && profileImage.size > 0) {
    const ext = profileImage.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const avatarPath = `${profile.id}/apply-avatar-${Date.now()}.${ext}`;

    const { error: avatarError } = await supabase.storage
      .from("avatars")
      .upload(avatarPath, profileImage, {
        cacheControl: "3600",
        upsert: false,
        contentType: profileImage.type,
      });

    if (avatarError) {
      if (identityDocPath) {
        await supabase.storage.from("athlete-identity-docs").remove([identityDocPath]);
      }
      return { error: "プロフィール画像のアップロードに失敗しました" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(avatarPath);

    profileImageUrl = `${publicUrl}?t=${Date.now()}`;
  }

  const { error } = await supabase.rpc("submit_athlete_application", {
    p_full_name: fullName,
    p_sport: sport,
    p_team: team,
    p_region: region,
    p_career_history: careerHistory,
    p_achievements: achievements,
    p_bio: bio,
    p_instagram_url: instagramUrl,
    p_tiktok_url: tiktokUrl,
    p_x_url: xUrl,
    p_profile_image_url: profileImageUrl,
    p_identity_doc_path: identityDocPath,
  });

  if (error) {
    if (identityDocPath) {
      await supabase.storage.from("athlete-identity-docs").remove([identityDocPath]);
    }
    return { error: translateApplicationError(error.message) };
  }

  revalidatePath("/athlete/apply");
  revalidatePath("/admin/applications");

  return { success: "選手申請を送信しました。審査結果をお待ちください。" };
}
