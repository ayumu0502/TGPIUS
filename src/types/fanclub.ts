export type FanclubBenefitType =
  | "exclusive_post"
  | "exclusive_video"
  | "exclusive_live"
  | "exclusive_event"
  | "exclusive_chat";

export type FanclubMembershipStatus = "active" | "cancelled" | "expired";

export type FanclubPostType = "post" | "video" | "live" | "event" | "chat";

export type FanclubPlanPrice = 500 | 1000 | 3000 | 5000;

export type FanclubCatalogItem = {
  athlete_id: string;
  athlete_name: string;
  athlete_sport: string;
  athlete_avatar_url: string | null;
  plan_count: number;
  member_count: number;
  min_price_yen: number;
};

export type FanclubBenefit = {
  benefit_type: FanclubBenefitType;
  title: string;
  description: string;
};

export type FanclubPlan = {
  id: string;
  title: string;
  description: string;
  price_yen: FanclubPlanPrice;
  is_active?: boolean;
  member_count: number;
  benefits: FanclubBenefit[];
};

export type FanclubMembership = {
  id: string;
  plan_id: string;
  status: FanclubMembershipStatus;
  started_at: string;
  current_period_end: string;
  cancelled_at?: string | null;
  price_yen: FanclubPlanPrice;
  athlete_id?: string;
  athlete_name?: string;
  athlete_avatar_url?: string | null;
  athlete_sport?: string;
  plan_title?: string;
};

export type FanclubPost = {
  id: string;
  plan_id: string | null;
  post_type: FanclubPostType;
  title: string;
  content: string;
  media_url: string;
  is_members_only: boolean;
  created_at: string;
};

export type FanclubAthletePage = {
  athlete: {
    id: string;
    name: string;
    sport: string;
    avatar_url: string | null;
  } | null;
  plans: FanclubPlan[];
  membership: FanclubMembership | null;
  posts: FanclubPost[];
};

export type FanclubMember = {
  id: string;
  fan_id: string;
  fan_name: string;
  fan_avatar_url: string | null;
  plan_id: string;
  price_yen: FanclubPlanPrice;
  status: FanclubMembershipStatus;
  started_at: string;
  current_period_end: string;
};

export type FanclubManageData = {
  plans: FanclubPlan[];
  members: FanclubMember[];
  stats: {
    active_members: number;
    monthly_revenue: number;
    churn_rate: number;
    member_growth: { month: string; count: number }[];
  };
};

export type FanclubAdminAnalytics = {
  total_subscriptions: number;
  active_subscriptions: number;
  total_revenue: number;
  monthly_revenue: number;
  join_rate: number;
  churn_rate: number;
  top_athletes: {
    athlete_name: string;
    member_count: number;
    revenue: number;
  }[];
};

export type FanclubActionState = {
  ok: boolean;
  message: string;
};

export type SaveFanclubPlanInput = {
  price_yen: FanclubPlanPrice;
  title: string;
  description?: string;
  benefit_types: FanclubBenefitType[];
  is_active?: boolean;
};

export type CreateFanclubPostInput = {
  title: string;
  content?: string;
  post_type: FanclubPostType;
  plan_id?: string | null;
  media_url?: string;
  is_members_only?: boolean;
};
