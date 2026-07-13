import { redirect } from "next/navigation";
import { startConversation } from "@/app/actions/messages";

type StartMessagePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function StartMessagePage({
  params,
}: StartMessagePageProps) {
  const { userId } = await params;
  const result = await startConversation(userId);

  if (result.conversationId) {
    redirect(`/messages/${result.conversationId}`);
  }

  redirect("/messages");
}
