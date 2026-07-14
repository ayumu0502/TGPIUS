import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import {
  getMyAthleteApplication,
} from "@/app/actions/athlete-application";
import { requireAthleteApplicant } from "@/app/actions/athlete-access";
import { isApprovedAthlete, canSubmitAthleteApplication } from "@/lib/athlete/status";
import AthleteApplicationForm from "@/components/athlete/AthleteApplicationForm";
import { AuthLogo } from "@/components/auth/AuthBackground";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import AppFooter from "@/components/layout/AppFooter";
import PageEnter from "@/components/ui/PageEnter";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "選手申請",
  description: "TGPLUS アスリート審査申請",
  path: "/athlete/apply",
});

export default async function AthleteApplyPage() {
  const profile = await requireAthleteApplicant();
  const latestApplication = await getMyAthleteApplication();

  if (isApprovedAthlete(profile)) {
    redirect("/athlete/dashboard");
  }

  const canSubmit = canSubmitAthleteApplication(profile.athlete_review_status);

  return (
    <div className="premium-app relative flex min-h-screen flex-col bg-[#f7f8fa]">
      <header className="sticky top-0 z-10 border-b border-[#e8eaed] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <AuthLogo theme="light" />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-[var(--card-border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--gold)] sm:text-sm"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <PageEnter>
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <p className="text-sm font-medium text-[var(--text-muted)]">アスリート登録</p>
              <h1 className="ja-heading mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                選手申請
              </h1>
              <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
                審査承認後に、ダッシュボード・投稿・ギフト受取・イベント作成などが利用できます。
              </p>
            </div>

            <AthleteApplicationForm
              canSubmit={canSubmit}
              currentStatus={profile.athlete_review_status}
              latestApplication={latestApplication}
            />

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--gold-dark)] hover:underline"
              >
                トップページに戻る
              </Link>
            </div>
          </div>
        </PageEnter>
      </main>
      <AppFooter />
    </div>
  );
}
