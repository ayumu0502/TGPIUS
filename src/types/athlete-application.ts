export type AthleteReviewStatus =
  | "not_applied"
  | "pending"
  | "approved"
  | "rejected"
  | "resubmit"
  | "suspended";

export const ATHLETE_REVIEW_STATUS_LABELS: Record<AthleteReviewStatus, string> = {
  not_applied: "未申請",
  pending: "審査中",
  approved: "承認",
  rejected: "却下",
  resubmit: "再提出依頼",
  suspended: "利用停止",
};

export type AthleteApplication = {
  id: string;
  user_id: string;
  full_name: string;
  sport: string;
  team: string;
  region: string;
  career_history: string;
  achievements: string;
  bio: string;
  instagram_url: string;
  tiktok_url: string;
  x_url: string;
  profile_image_url: string | null;
  identity_doc_path?: string;
  status: AthleteReviewStatus;
  review_note: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type AthleteApplicationAuditEntry = {
  id: string;
  application_id: string | null;
  user_id: string;
  admin_id: string;
  action: string;
  previous_status: AthleteReviewStatus | null;
  new_status: AthleteReviewStatus | null;
  note: string;
  created_at: string;
  admin_name?: string;
};

export type AdminAthleteApplicationRow = AthleteApplication & {
  user_name: string;
  user_email: string;
};

export type AthleteApplicationFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<
    Record<
      | "full_name"
      | "sport"
      | "team"
      | "region"
      | "career_history"
      | "achievements"
      | "bio"
      | "instagram_url"
      | "tiktok_url"
      | "x_url"
      | "profile_image"
      | "identity_doc",
      string
    >
  >;
};

export type AdminReviewActionState = {
  error?: string;
  success?: string;
};

export function mapAthleteApplicationRow(
  row: Record<string, unknown>,
  options?: { includeIdentityDoc?: boolean }
): AthleteApplication {
  const base: AthleteApplication = {
    id: String(row.id),
    user_id: String(row.user_id),
    full_name: String(row.full_name ?? ""),
    sport: String(row.sport ?? ""),
    team: String(row.team ?? ""),
    region: String(row.region ?? ""),
    career_history: String(row.career_history ?? ""),
    achievements: String(row.achievements ?? ""),
    bio: String(row.bio ?? ""),
    instagram_url: String(row.instagram_url ?? ""),
    tiktok_url: String(row.tiktok_url ?? ""),
    x_url: String(row.x_url ?? ""),
    profile_image_url: row.profile_image_url
      ? String(row.profile_image_url)
      : null,
    status: String(row.status) as AthleteReviewStatus,
    review_note: String(row.review_note ?? ""),
    reviewed_by: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    submitted_at: String(row.submitted_at ?? row.created_at ?? ""),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };

  if (options?.includeIdentityDoc && row.identity_doc_path) {
    base.identity_doc_path = String(row.identity_doc_path);
  }

  return base;
}
