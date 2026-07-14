import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getConversations } from "@/app/actions/messages";
import ConversationList from "@/components/messages/ConversationList";
import PremiumMessagesEmpty from "@/components/messages/PremiumMessagesEmpty";
import PremiumMessagesShell from "@/components/messages/PremiumMessagesShell";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = {
  title: "メッセージ | TGPLUS",
  description: "DM · ダイレクトメッセージ",
};

type MessagesPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { error } = await searchParams;

  const [conversations, layoutCounts] = await Promise.all([
    getConversations(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="messages"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <PremiumMessagesShell
        sidebar={
          <ConversationList
            conversations={conversations}
            accountType={profile.account_type}
            variant="light"
            initialError={error}
          />
        }
      >
        <PremiumMessagesEmpty />
      </PremiumMessagesShell>
    </PremiumLayout>
  );
}
