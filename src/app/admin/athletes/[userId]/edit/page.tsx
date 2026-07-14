import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminAthleteProxyEditForm from "@/components/admin/AdminAthleteProxyEditForm";
import { createPageMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export const metadata: Metadata = createPageMetadata({
  title: "選手プロフィール代理編集",
  path: "/admin/athletes/edit",
  noIndex: true,
});

export default async function AdminAthleteProxyEditPage({ params }: PageProps) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, name, sport, team, agency, region, career_history, achievements, bio, goals, instagram_url, tiktok_url, x_url, youtube_url, is_profile_public, athlete_review_status, account_type"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.account_type !== "athlete") notFound();

  return (
    <div>
      <Link href="/admin/athletes" className="text-sm text-[var(--gold-dark)] hover:underline">
        ← 招待管理へ
      </Link>
      <h1 className="mt-4 text-2xl font-bold">選手プロフィール代理編集</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{profile.name}</p>
      <div className="mt-6 max-w-2xl">
        <AdminAthleteProxyEditForm
          userId={userId}
          profile={{
            name: String(profile.name),
            sport: String(profile.sport ?? ""),
            team: String(profile.team ?? ""),
            agency: String(profile.agency ?? ""),
            region: String(profile.region ?? ""),
            career_history: String(profile.career_history ?? ""),
            achievements: String(profile.achievements ?? ""),
            bio: String(profile.bio ?? ""),
            goals: String(profile.goals ?? ""),
            instagram_url: String(profile.instagram_url ?? ""),
            tiktok_url: String(profile.tiktok_url ?? ""),
            x_url: String(profile.x_url ?? ""),
            youtube_url: String(profile.youtube_url ?? ""),
            is_profile_public: Boolean(profile.is_profile_public),
            athlete_review_status: String(profile.athlete_review_status ?? "approved"),
          }}
        />
      </div>
    </div>
  );
}
