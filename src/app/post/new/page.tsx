import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import CreatePostForm from "@/components/social/CreatePostForm";
import SocialLayout from "@/components/social/SocialLayout";

export const metadata: Metadata = {
  title: "新規投稿 | TGPLUS",
};

export default async function NewPostPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <SocialLayout
      currentUserId={profile.id}
      accountType={profile.account_type}
      activeTab="new"
    >
      <CreatePostForm />
    </SocialLayout>
  );
}
