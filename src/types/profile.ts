import type { AccountType } from "@/types/auth";

export type AthleteProfileFields = {
  avatar_url: string | null;
  cover_url: string | null;
  sport: string;
  team: string;
  region: string;
  bio: string;
  achievements: string;
  goals: string;
  instagram_url: string;
  tiktok_url: string;
  x_url: string;
  youtube_url: string;
  is_verified: boolean;
};

export type PublicProfile = {
  id: string;
  name: string;
  email: string;
  account_type: AccountType;
  created_at: string;
  post_count: number;
  avatar_url: string | null;
  cover_url: string | null;
  sport: string;
  team: string;
  region: string;
  bio: string;
  achievements: string;
  goals: string;
  instagram_url: string;
  tiktok_url: string;
  x_url: string;
  youtube_url: string;
  is_verified: boolean;
};

export type ProfileEditState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const PROFILE_SELECT = `
  id,
  name,
  email,
  account_type,
  created_at,
  avatar_url,
  sport,
  team,
  region,
  bio,
  achievements,
  goals,
  instagram_url,
  tiktok_url,
  x_url
`;

export const PROFILE_EXTENDED_SELECT = `
  cover_url,
  youtube_url,
  is_verified
`;

export function mapProfileRow(
  row: Record<string, unknown>,
  postCount: number
): PublicProfile {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    account_type: row.account_type as AccountType,
    created_at: String(row.created_at ?? ""),
    post_count: postCount,
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    cover_url: row.cover_url ? String(row.cover_url) : null,
    sport: String(row.sport ?? ""),
    team: String(row.team ?? ""),
    region: String(row.region ?? ""),
    bio: String(row.bio ?? ""),
    achievements: String(row.achievements ?? ""),
    goals: String(row.goals ?? ""),
    instagram_url: String(row.instagram_url ?? ""),
    tiktok_url: String(row.tiktok_url ?? ""),
    x_url: String(row.x_url ?? ""),
    youtube_url: String(row.youtube_url ?? ""),
    is_verified: Boolean(row.is_verified),
  };
}
