import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAthleteForGift, getPointBalance } from "@/app/actions/gifts";
import { getCurrentProfile } from "@/app/actions/auth";
import GiftSendForm from "@/components/gifts/GiftSendForm";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

type GiftSendPageProps = {
  params: Promise<{ athleteId: string }>;
};

export async function generateMetadata({
  params,
}: GiftSendPageProps): Promise<Metadata> {
  const { athleteId } = await params;
  const athlete = await getAthleteForGift(athleteId);
  return {
    title: athlete
      ? `${athlete.name}へギフト | TGPLUS`
      : "ギフト送信 | TGPLUS",
    description: "メッセージ付きポイントギフトを送る",
  };
}

export default async function GiftSendPage({ params }: GiftSendPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "fan") {
    redirect(`/${profile.account_type}/dashboard`);
  }

  const { athleteId } = await params;
  const [athlete, pointBalance, layoutCounts] = await Promise.all([
    getAthleteForGift(athleteId),
    getPointBalance(),
    getPremiumLayoutCounts(profile.account_type),
  ]);
  if (!athlete) notFound();

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="gifts"
      pointBalance={pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/fan/gifts"
          className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--gold-dark)]"
        >
          ← ギフト一覧に戻る
        </Link>
        <div className="mt-6">
          <GiftSendForm athlete={athlete} pointBalance={pointBalance} />
        </div>
      </div>
    </PremiumLayout>
  );
}
