import type {
  FanclubAdminAnalytics,
  FanclubAthletePage,
  FanclubBenefit,
  FanclubBenefitType,
  FanclubCatalogItem,
  FanclubManageData,
  FanclubMembership,
  FanclubPlan,
  FanclubPost,
} from "@/types/fanclub";

export function mapCatalogItem(row: Record<string, unknown>): FanclubCatalogItem {
  return {
    athlete_id: String(row.athlete_id),
    athlete_name: String(row.athlete_name ?? ""),
    athlete_sport: String(row.athlete_sport ?? ""),
    athlete_avatar_url: row.athlete_avatar_url
      ? String(row.athlete_avatar_url)
      : null,
    plan_count: Number(row.plan_count ?? 0),
    member_count: Number(row.member_count ?? 0),
    min_price_yen: Number(row.min_price_yen ?? 0),
  };
}

export function mapSubscription(row: Record<string, unknown>): FanclubMembership {
  return {
    id: String(row.id),
    athlete_id: String(row.athlete_id ?? ""),
    athlete_name: String(row.athlete_name ?? ""),
    athlete_avatar_url: row.athlete_avatar_url
      ? String(row.athlete_avatar_url)
      : null,
    athlete_sport: String(row.athlete_sport ?? ""),
    plan_id: String(row.plan_id),
    plan_title: String(row.plan_title ?? ""),
    price_yen: Number(row.price_yen ?? 0) as FanclubMembership["price_yen"],
    status: row.status as FanclubMembership["status"],
    started_at: String(row.started_at ?? ""),
    cancelled_at: row.cancelled_at ? String(row.cancelled_at) : null,
    current_period_end: String(row.current_period_end ?? ""),
  };
}

export function parseAthleteFanclubPage(data: unknown): FanclubAthletePage {
  const parsed = (data ?? {}) as Record<string, unknown>;
  const athlete = parsed.athlete as Record<string, unknown> | null;
  const membership = parsed.membership as Record<string, unknown> | null;

  return {
    athlete: athlete
      ? {
          id: String(athlete.id),
          name: String(athlete.name ?? ""),
          sport: String(athlete.sport ?? ""),
          avatar_url: athlete.avatar_url ? String(athlete.avatar_url) : null,
        }
      : null,
    plans: ((parsed.plans as unknown[]) ?? []).map((plan) =>
      mapPlan(plan as Record<string, unknown>)
    ),
    membership: membership
      ? {
          id: String(membership.id),
          plan_id: String(membership.plan_id),
          status: membership.status as FanclubMembership["status"],
          started_at: String(membership.started_at ?? ""),
          current_period_end: String(membership.current_period_end ?? ""),
          price_yen: Number(membership.price_yen ?? 0) as FanclubMembership["price_yen"],
        }
      : null,
    posts: ((parsed.posts as unknown[]) ?? []).map((post) =>
      mapPost(post as Record<string, unknown>)
    ),
  };
}

export function parseManageData(data: unknown): FanclubManageData {
  const parsed = (data ?? {}) as Record<string, unknown>;
  const stats = (parsed.stats ?? {}) as Record<string, unknown>;

  return {
    plans: ((parsed.plans as unknown[]) ?? []).map((plan) =>
      mapPlan(plan as Record<string, unknown>)
    ),
    members: ((parsed.members as unknown[]) ?? []).map((member) => ({
      id: String((member as Record<string, unknown>).id),
      fan_id: String((member as Record<string, unknown>).fan_id),
      fan_name: String((member as Record<string, unknown>).fan_name ?? ""),
      fan_avatar_url: (member as Record<string, unknown>).fan_avatar_url
        ? String((member as Record<string, unknown>).fan_avatar_url)
        : null,
      plan_id: String((member as Record<string, unknown>).plan_id),
      price_yen: Number((member as Record<string, unknown>).price_yen ?? 0) as FanclubManageData["members"][number]["price_yen"],
      status: (member as Record<string, unknown>).status as FanclubManageData["members"][number]["status"],
      started_at: String((member as Record<string, unknown>).started_at ?? ""),
      current_period_end: String(
        (member as Record<string, unknown>).current_period_end ?? ""
      ),
    })),
    stats: {
      active_members: Number(stats.active_members ?? 0),
      monthly_revenue: Number(stats.monthly_revenue ?? 0),
      churn_rate: Number(stats.churn_rate ?? 0),
      member_growth: ((stats.member_growth as unknown[]) ?? []).map((item) => ({
        month: String((item as Record<string, unknown>).month ?? ""),
        count: Number((item as Record<string, unknown>).count ?? 0),
      })),
    },
  };
}

export function parseAdminAnalytics(data: unknown): FanclubAdminAnalytics {
  const parsed = (data ?? {}) as Record<string, unknown>;
  return {
    total_subscriptions: Number(parsed.total_subscriptions ?? 0),
    active_subscriptions: Number(parsed.active_subscriptions ?? 0),
    total_revenue: Number(parsed.total_revenue ?? 0),
    monthly_revenue: Number(parsed.monthly_revenue ?? 0),
    join_rate: Number(parsed.join_rate ?? 0),
    churn_rate: Number(parsed.churn_rate ?? 0),
    top_athletes: ((parsed.top_athletes as unknown[]) ?? []).map((item) => ({
      athlete_name: String((item as Record<string, unknown>).athlete_name ?? ""),
      member_count: Number((item as Record<string, unknown>).member_count ?? 0),
      revenue: Number((item as Record<string, unknown>).revenue ?? 0),
    })),
  };
}

function mapPlan(row: Record<string, unknown>): FanclubPlan {
  const benefitsRaw = row.benefits;
  let benefits: FanclubBenefit[] = [];

  if (Array.isArray(benefitsRaw)) {
    if (benefitsRaw.length > 0 && typeof benefitsRaw[0] === "string") {
      benefits = (benefitsRaw as FanclubBenefitType[]).map((benefitType) => ({
        benefit_type: benefitType,
        title: benefitType,
        description: "",
      }));
    } else {
      benefits = benefitsRaw.map((item) => ({
        benefit_type: (item as Record<string, unknown>)
          .benefit_type as FanclubBenefitType,
        title: String((item as Record<string, unknown>).title ?? ""),
        description: String((item as Record<string, unknown>).description ?? ""),
      }));
    }
  }

  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    price_yen: Number(row.price_yen ?? 0) as FanclubPlan["price_yen"],
    is_active: row.is_active !== undefined ? Boolean(row.is_active) : true,
    member_count: Number(row.member_count ?? 0),
    benefits,
  };
}

function mapPost(row: Record<string, unknown>): FanclubPost {
  return {
    id: String(row.id),
    plan_id: row.plan_id ? String(row.plan_id) : null,
    post_type: row.post_type as FanclubPost["post_type"],
    title: String(row.title ?? ""),
    content: String(row.content ?? ""),
    media_url: String(row.media_url ?? ""),
    is_members_only: Boolean(row.is_members_only),
    created_at: String(row.created_at ?? ""),
  };
}
