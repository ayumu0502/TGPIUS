import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import CreatePostForm from "@/components/social/CreatePostForm";
import SocialLayout from "@/components/social/SocialLayout";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "新規投稿",
  description: "写真や動画を投稿",
  path: "/post/new",
});

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
