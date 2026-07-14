"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { isApprovedAthlete } from "@/lib/athlete/status";
import { requireAdmin } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/server";
import {
  mapCatalogItem,
  mapSubscription,
  parseAdminAnalytics,
  parseAthleteFanclubPage,
  parseManageData,
} from "@/lib/fanclub/helpers";
import type {
  CreateFanclubPostInput,
  FanclubActionState,
  FanclubAdminAnalytics,
  FanclubAthletePage,
  FanclubBenefitType,
  FanclubCatalogItem,
  FanclubManageData,
  FanclubMembership,
  FanclubPlanPrice,
  SaveFanclubPlanInput,
} from "@/types/fanclub";

const FANCLUB_ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "ログインが必要です",
  NOT_ATHLETE: "アスリートのみ操作できます",
  NOT_FAN: "ファンアカウントのみ加入できます",
  INVALID_PRICE: "価格が正しくありません",
  TITLE_REQUIRED: "タイトルを入力してください",
  PLAN_NOT_FOUND: "プランが見つかりません",
  SELF_SUBSCRIBE: "自分のファンクラブには加入できません",
  ALREADY_SUBSCRIBED: "すでに加入済みです",
  INSUFFICIENT_BALANCE: "ポイント残高が不足しています",
  MEMBERSHIP_NOT_FOUND: "加入情報が見つかりません",
};

function translateFanclubError(message: string): string {
  for (const [code, text] of Object.entries(FANCLUB_ERROR_MESSAGES)) {
    if (message.includes(code)) return text;
  }
  if (
    message.includes("save_fanclub_plan") ||
    message.includes("could not find the function")
  ) {
    return "Supabase で fanclub-schema.sql が未実行です。SQL Editor から実行してください";
  }
  return "操作に失敗しました";
}

export async function listFanclubCatalog(limit = 50): Promise<FanclubCatalogItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_fanclub_catalog", { p_limit: limit });
  if (error) {
    console.error("listFanclubCatalog:", error.message);
    return [];
  }
  return (data ?? []).map((row: Record<string, unknown>) => mapCatalogItem(row));
}

export async function getAthleteFanclubPage(
  athleteId: string
): Promise<FanclubAthletePage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_athlete_fanclub_page", {
    p_athlete_id: athleteId,
  });
  if (error || !data) return null;
  const parsed = parseAthleteFanclubPage(data);
  return parsed.athlete ? parsed : null;
}

export async function getAthleteFanclubManage(): Promise<FanclubManageData> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_athlete_fanclub_manage");
  if (error || !data) {
    return {
      plans: [],
      members: [],
      stats: {
        active_members: 0,
        monthly_revenue: 0,
        churn_rate: 0,
        member_growth: [],
      },
    };
  }
  return parseManageData(data);
}

export async function listFanSubscriptions(): Promise<FanclubMembership[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_fan_subscriptions");
  if (error) return [];
  return (data ?? []).map((row: Record<string, unknown>) => mapSubscription(row));
}

export async function getAdminFanclubAnalytics(): Promise<FanclubAdminAnalytics> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_fanclub_analytics");
  if (error || !data) {
    return {
      total_subscriptions: 0,
      active_subscriptions: 0,
      total_revenue: 0,
      monthly_revenue: 0,
      join_rate: 0,
      churn_rate: 0,
      top_athletes: [],
    };
  }
  return parseAdminAnalytics(data);
}

export async function saveFanclubPlan(
  input: SaveFanclubPlanInput
): Promise<FanclubActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.account_type !== "athlete") {
    return { ok: false, message: "アスリートのみプランを作成できます" };
  }
  if (!isApprovedAthlete(profile)) {
    return { ok: false, message: "選手申請の承認後にプランを作成できます" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_fanclub_plan", {
    p_price_yen: input.price_yen,
    p_title: input.title.trim(),
    p_description: input.description?.trim() ?? "",
    p_benefit_types: input.benefit_types,
    p_is_active: input.is_active ?? true,
  });

  if (error) return { ok: false, message: translateFanclubError(error.message) };

  revalidatePath("/athlete/fanclub");
  revalidatePath("/fanclub");
  return { ok: true, message: "プランを保存しました" };
}

export async function subscribeFanclubPlan(planId: string): Promise<FanclubActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("subscribe_fanclub_plan", { p_plan_id: planId });
  if (error) return { ok: false, message: translateFanclubError(error.message) };

  revalidatePath("/fanclub");
  revalidatePath("/fan/subscriptions");
  return { ok: true, message: "ファンクラブに加入しました" };
}

export async function cancelFanclubMembership(
  membershipId: string
): Promise<FanclubActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_fanclub_membership", {
    p_membership_id: membershipId,
  });
  if (error) return { ok: false, message: translateFanclubError(error.message) };

  revalidatePath("/fan/subscriptions");
  revalidatePath("/fanclub");
  return { ok: true, message: "サブスクリプションを解約しました" };
}

export async function createFanclubPost(
  input: CreateFanclubPostInput
): Promise<FanclubActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.account_type !== "athlete") {
    return { ok: false, message: "アスリートのみ投稿できます" };
  }
  if (!isApprovedAthlete(profile)) {
    return { ok: false, message: "選手申請の承認後に限定コンテンツを作成できます" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_fanclub_post", {
    p_title: input.title.trim(),
    p_content: input.content?.trim() ?? "",
    p_post_type: input.post_type,
    p_plan_id: input.plan_id || null,
    p_media_url: input.media_url?.trim() ?? "",
    p_is_members_only: input.is_members_only ?? true,
  });

  if (error) return { ok: false, message: translateFanclubError(error.message) };

  revalidatePath("/athlete/fanclub");
  revalidatePath("/fanclub");
  return { ok: true, message: "会員限定コンテンツを公開しました" };
}

export async function saveFanclubPlanAction(
  _prev: FanclubActionState,
  formData: FormData
): Promise<FanclubActionState> {
  const priceYen = Number(formData.get("price_yen")) as FanclubPlanPrice;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const benefitTypes = formData
    .getAll("benefit_types")
    .map((value) => String(value)) as FanclubBenefitType[];

  if (!title) return { ok: false, message: "プラン名を入力してください" };

  return saveFanclubPlan({
    price_yen: priceYen,
    title,
    description,
    benefit_types: benefitTypes,
  });
}

export async function createFanclubPostAction(
  _prev: FanclubActionState,
  formData: FormData
): Promise<FanclubActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const postType = String(formData.get("post_type") ?? "post") as CreateFanclubPostInput["post_type"];
  const planId = String(formData.get("plan_id") ?? "").trim();
  const mediaUrl = String(formData.get("media_url") ?? "").trim();

  if (!title) return { ok: false, message: "タイトルを入力してください" };

  return createFanclubPost({
    title,
    content,
    post_type: postType,
    plan_id: planId || null,
    media_url: mediaUrl,
  });
}
