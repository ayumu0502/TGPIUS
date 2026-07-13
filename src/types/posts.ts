import type { AccountType } from "@/types/auth";

export type MediaType = "image" | "video";

export type PostProfile = {
  id: string;
  name: string;
  account_type: AccountType;
};

export type Post = {
  id: string;
  user_id: string;
  caption: string;
  media_type: MediaType;
  media_url: string;
  created_at: string;
};

export type PostWithMeta = Post & {
  profile: PostProfile;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: PostProfile;
};

export type ProfileWithStats = PostProfile & {
  email: string;
  post_count: number;
  created_at: string;
};

export type PostFormState = {
  error?: string;
  success?: string;
};

export type CommentFormState = {
  error?: string;
};
