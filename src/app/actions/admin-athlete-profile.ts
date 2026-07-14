"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/server";
import type { AthleteReviewStatus } from "@/types/athlete-application";
import type { AdminAthleteFormState } from "@/types/athlete-invite";

export async function adminUpdateAthleteProfileProxy(
  _prev: AdminAthleteFormState | null,
  formData: FormData
): Promise<AdminAthleteFormState> {
  await requireAdmin();
  const supabase = await createClient();
  const userId = String(formData.get("user_id") ?? "");

  const { error } = await supabase.rpc("admin_update_athlete_profile_proxy", {
    p_user_id: userId,
    p_name: String(formData.get("name") ?? ""),
    p_sport: String(formData.get("sport") ?? ""),
    p_team: String(formData.get("team") ?? ""),
    p_agency: String(formData.get("agency") ?? ""),
    p_region: String(formData.get("region") ?? ""),
    p_career_history: String(formData.get("career_history") ?? ""),
    p_achievements: String(formData.get("achievements") ?? ""),
    p_bio: String(formData.get("bio") ?? ""),
    p_goals: String(formData.get("goals") ?? ""),
    p_instagram_url: String(formData.get("instagram_url") ?? ""),
    p_tiktok_url: String(formData.get("tiktok_url") ?? ""),
    p_x_url: String(formData.get("x_url") ?? ""),
    p_youtube_url: String(formData.get("youtube_url") ?? ""),
    p_is_profile_public: formData.get("is_profile_public") === "on",
    p_review_status: String(formData.get("review_status") ?? "") as AthleteReviewStatus,
  });

  if (error) return { error: "プロフィールの更新に失敗しました" };

  revalidatePath(`/profile/${userId}`);
  revalidatePath("/admin/athletes");
  return { success: "選手プロフィールを更新しました" };
}
