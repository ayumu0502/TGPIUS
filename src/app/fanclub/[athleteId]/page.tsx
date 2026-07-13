import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getAthleteFanclubPage } from "@/app/actions/fanclub";
import FanclubPlanCards from "@/components/fanclub/FanclubPlanCards";
import FanclubPostsList from "@/components/fanclub/FanclubPostsList";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { formatMembershipPeriod } from "@/lib/fanclub/constants";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

type FanclubAthletePageProps = {
  params: Promise<{ athleteId: string }>;
};

export async function generateMetadata({
  params,
}: FanclubAthletePageProps): Promise<Metadata> {
  const { athleteId } = await params;
  const page = await getAthleteFanclubPage(athleteId);
  return {
    title: page?.athlete
      ? `${page.athlete.name} ファンクラブ | TGPLUS`
      : "ファンクラブ | TGPLUS",
  };
}

export default async function FanclubAthletePage({ params }: FanclubAthletePageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { athleteId } = await params;
  const [pageData, layoutCounts] = await Promise.all([
    getAthleteFanclubPage(athleteId),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  if (!pageData?.athlete) notFound();

  const isMember = Boolean(pageData.membership);
  const canSubscribe =
    profile.account_type === "fan" && profile.id !== athleteId;

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="fanclub"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Link href="/fanclub" className="text-sm text-[var(--gold-dark)] hover:underline">
            ← ファンクラブ一覧
          </Link>

          <div className="premium-card overflow-hidden">
            <div className="premium-event-hero p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  name={pageData.athlete.name}
                  avatarUrl={pageData.athlete.avatar_url}
                  size="lg"
                />
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                    {pageData.athlete.name} ファンクラブ
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {pageData.athlete.sport || "アスリート"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {pageData.membership ? (
            <div className="premium-card border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/10 to-white p-5">
              <p className="text-sm font-bold text-[var(--text-primary)]">会員ステータス</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                加入中 ·{" "}
                {formatMembershipPeriod(
                  pageData.membership.started_at,
                  pageData.membership.current_period_end
                )}
              </p>
            </div>
          ) : null}

          <section>
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">プラン一覧</h2>
            <FanclubPlanCards
              plans={pageData.plans}
              activePlanId={pageData.membership?.plan_id}
              canSubscribe={canSubscribe}
            />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              会員限定コンテンツ
            </h2>
            <FanclubPostsList posts={pageData.posts} isMember={isMember} />
          </section>
        </div>
      </div>
    </PremiumLayout>
  );
}
