import type { AthleteReviewStatus } from "@/types/athlete-application";

export type OrganizationType = "agency" | "team" | "school" | "club";
export type OrganizationStatus = "active" | "inactive" | "hidden";
export type MembershipStatus = "active" | "left" | "suspended" | "hidden";
export type AthleteInviteStatus = "draft" | "invited" | "completed" | "cancelled" | "expired";

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  agency: "事務所",
  team: "チーム",
  school: "学校",
  club: "クラブ",
};

export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
  active: "有効",
  inactive: "無効",
  hidden: "非公開",
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "所属中",
  left: "退所",
  suspended: "活動停止",
  hidden: "非公開",
};

export const ATHLETE_INVITE_STATUS_LABELS: Record<AthleteInviteStatus, string> = {
  draft: "未送信",
  invited: "招待済み",
  completed: "登録完了",
  cancelled: "取消",
  expired: "期限切れ",
};

export function getRegistrationStatusLabel(
  inviteStatus: AthleteInviteStatus | null | undefined,
  linkedUserId: string | null | undefined
): string {
  if (linkedUserId) return "登録完了";
  if (inviteStatus === "invited") return "招待済み";
  if (inviteStatus === "draft") return "未登録";
  if (inviteStatus === "cancelled") return "取消";
  if (inviteStatus === "expired") return "期限切れ";
  return "未登録";
}

export type Organization = {
  id: string;
  name: string;
  org_type: OrganizationType;
  description: string;
  region: string;
  status: OrganizationStatus;
  admin_note: string;
  created_at: string;
  updated_at: string;
};

export type ProvisionalAthleteProfile = {
  id: string;
  email: string;
  full_name: string;
  sport: string;
  team: string;
  agency: string;
  region: string;
  career_history: string;
  achievements: string;
  bio: string;
  goals: string;
  is_public: boolean;
  review_status: AthleteReviewStatus;
  admin_note: string;
  organization_id: string | null;
  organization_name?: string | null;
  linked_user_id: string | null;
  created_at: string;
  updated_at: string;
  invite_status?: AthleteInviteStatus | null;
  invite_expires_at?: string | null;
  invite_sent_at?: string | null;
};

export type AthleteInvitePublic = {
  invite_id: string;
  email: string;
  full_name: string;
  sport: string;
  expires_at: string;
  status: AthleteInviteStatus;
  is_valid: boolean;
};

export type AdminAthleteFormState = {
  error?: string;
  success?: string;
  provisionalId?: string;
  inviteToken?: string;
  inviteUrl?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export type BulkImportState = {
  error?: string;
  success?: string;
  imported?: number;
  failed?: number;
  errors?: string[];
};
