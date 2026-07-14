import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getCurrentUserSupporterAccess } from "@/lib/subscription/access";
import { exclusiveContent } from "@/lib/landing/data";
import { SUPPORTER_PLAN } from "@/lib/stripe/plans";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata = createPrivatePageMetadata({
  title: "限定コンテンツ",
  description: "TGPLUSサポーター限定の特別コンテンツ",
  path: "/fan/exclusive",
});

export default async function FanExclusivePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "fan") {
    redirect(`/${profile.account_type}/dashboard`);
  }

  const [access, layoutCounts] = await Promise.all([
    getCurrentUserSupporterAccess(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  const isActive = access?.isActive ?? false;

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
        avatarUrl: undefined,
      }}
      activeNav="dashboard"
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="ja-heading text-2xl font-bold text-[var(--text-primary)]">
          サポーター限定コンテンツ
        </h1>
        <p className="ja-body mt-2 text-sm text-[var(--text-muted)]">
          {SUPPORTER_PLAN.name}会員だけが閲覧できる特別コンテンツです。
        </p>

        {!isActive ? (
          <div className="premium-card mt-8 p-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              このコンテンツはサポーター会員限定です。
            </p>
            <Link href="/supporter" className="btn-gold mt-6 inline-block rounded-full px-8 py-3 text-sm">
              サポーターに加入する
            </Link>
          </div>
        ) : (
          <>
            {access?.periodEnd ? (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                次回更新日: {new Date(access.periodEnd).toLocaleDateString("ja-JP")}
                {access.cancelAtPeriodEnd ? "（期間終了時に解約予定）" : ""}
              </p>
            ) : null}

            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {exclusiveContent.map((item) => (
                <article
                  key={item.id}
                  className="premium-card overflow-hidden p-0"
                >
                  <div className="border-b border-[var(--card-border)] bg-gradient-to-br from-[rgba(197,160,89,0.1)] to-white px-5 py-4">
                    <span className="inline-flex rounded-full border border-[var(--gold)]/30 bg-[rgba(197,160,89,0.1)] px-3 py-1 text-xs font-semibold text-[var(--gold-dark)]">
                      {item.badge}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-[var(--text-muted)]">{item.type}</p>
                    <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.athlete}</p>
                    <p className="ja-body mt-4 text-sm text-[var(--text-muted)]">
                      サポーター会員限定のコンテンツです。近日公開予定のプレビュー表示です。
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/supporter"
                className="text-sm font-semibold text-[var(--gold-dark)] hover:underline"
              >
                プラン管理・解約はこちら
              </Link>
            </div>
          </>
        )}
      </div>
    </PremiumLayout>
  );
}
