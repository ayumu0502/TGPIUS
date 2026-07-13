import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import {
  getConversationMessages,
  getConversations,
} from "@/app/actions/messages";
import ChatRoom from "@/components/messages/ChatRoom";
import ConversationList from "@/components/messages/ConversationList";
import PremiumMessagesShell from "@/components/messages/PremiumMessagesShell";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export async function generateMetadata({
  params,
}: ConversationPageProps): Promise<Metadata> {
  const { conversationId } = await params;
  const data = await getConversationMessages(conversationId);
  return {
    title: data?.otherUser
      ? `${data.otherUser.name} | メッセージ | TGPLUS`
      : "メッセージ | TGPLUS",
  };
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { conversationId } = await params;
  const [data, conversations, layoutCounts] = await Promise.all([
    getConversationMessages(conversationId),
    getConversations(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  if (!data || !data.otherUser) notFound();

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
        activeConversationId={conversationId}
        sidebar={
          <ConversationList
            conversations={conversations}
            activeConversationId={conversationId}
            accountType={profile.account_type}
            variant="light"
          />
        }
      >
        <ChatRoom
          conversationId={conversationId}
          initialMessages={data.messages}
          otherUser={data.otherUser}
          currentUserId={profile.id}
          variant="light"
        />
      </PremiumMessagesShell>
    </PremiumLayout>
  );
}
