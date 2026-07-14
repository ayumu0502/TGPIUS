"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { isApprovedAthlete } from "@/lib/athlete/status";
import { getPublicProfile } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";
import type {
  Comment,
  CommentFormState,
  MediaType,
  PostFormState,
  PostProfile,
  PostWithMeta,
} from "@/types/posts";
import type { PublicProfile } from "@/types/profile";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

type RawPostRow = {
  id: string;
  user_id: string;
  caption: string | null;
  media_type: MediaType;
  media_url: string;
  created_at: string;
  profiles: PostProfile | PostProfile[] | null;
  likes: { user_id: string }[] | null;
  comments: { id: string }[] | null;
};

function unwrapProfile(
  profiles: PostProfile | PostProfile[] | null
): PostProfile {
  if (Array.isArray(profiles)) return profiles[0];
  return profiles ?? { id: "", name: "不明", account_type: "fan" };
}

function mapPost(row: RawPostRow, currentUserId: string): PostWithMeta {
  const likes = row.likes ?? [];
  const comments = row.comments ?? [];

  return {
    id: row.id,
    user_id: row.user_id,
    caption: row.caption ?? "",
    media_type: row.media_type,
    media_url: row.media_url,
    created_at: row.created_at,
    profile: unwrapProfile(row.profiles),
    like_count: likes.length,
    comment_count: comments.length,
    liked_by_me: likes.some((like) => like.user_id === currentUserId),
  };
}

const postSelect = `
  id,
  user_id,
  caption,
  media_type,
  media_url,
  created_at,
  profiles (id, name, account_type),
  likes (user_id),
  comments (id)
`;

export async function getFeedPosts(): Promise<PostWithMeta[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(postSelect)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return (data as RawPostRow[]).map((row) => mapPost(row, profile.id));
}

export async function getUserPosts(userId: string): Promise<PostWithMeta[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(postSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as RawPostRow[]).map((row) => mapPost(row, profile.id));
}

export async function getProfileById(
  userId: string
): Promise<PublicProfile | null> {
  return getPublicProfile(userId);
}

export async function getPostComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      post_id,
      user_id,
      content,
      created_at,
      profiles (id, name, account_type)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    profile: unwrapProfile(
      row.profiles as PostProfile | PostProfile[] | null
    ),
  }));
}

function detectMediaType(mimeType: string): MediaType | null {
  if (IMAGE_TYPES.includes(mimeType)) return "image";
  if (VIDEO_TYPES.includes(mimeType)) return "video";
  return null;
}

export async function createPost(
  _prevState: PostFormState | null,
  formData: FormData
): Promise<PostFormState> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { error: "ログインが必要です" };
  }

  if (profile.account_type === "athlete" && !isApprovedAthlete(profile)) {
    return { error: "選手申請の承認後に投稿できます" };
  }

  const caption = String(formData.get("caption") ?? "").trim();
  const file = formData.get("media") as File | null;

  if (!file || file.size === 0) {
    return { error: "画像または動画を選択してください" };
  }

  const mediaType = detectMediaType(file.type);
  if (!mediaType) {
    return {
      error: "対応形式: JPEG, PNG, WebP, GIF, MP4, WebM, MOV",
    };
  }

  if (mediaType === "image" && file.size > MAX_IMAGE_SIZE) {
    return { error: "画像は10MB以下にしてください" };
  }

  if (mediaType === "video" && file.size > MAX_VIDEO_SIZE) {
    return { error: "動画は50MB以下にしてください" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filePath = `${profile.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("post-media")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: "ファイルのアップロードに失敗しました" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("post-media").getPublicUrl(filePath);

  const { error: insertError } = await supabase.from("posts").insert({
    user_id: profile.id,
    caption,
    media_type: mediaType,
    media_url: publicUrl,
  });

  if (insertError) {
    await supabase.storage.from("post-media").remove([filePath]);
    return { error: "投稿の保存に失敗しました" };
  }

  revalidatePath("/feed");
  revalidatePath(`/profile/${profile.id}`);

  return { success: "投稿しました" };
}

export async function toggleLike(postId: string): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "ログインが必要です" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: "いいねの解除に失敗しました" };
  } else {
    const { error } = await supabase.from("likes").insert({
      post_id: postId,
      user_id: profile.id,
    });
    if (error) return { error: "いいねに失敗しました" };
  }

  revalidatePath("/feed");
  return {};
}

export async function addComment(
  _prevState: CommentFormState | null,
  formData: FormData
): Promise<CommentFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "ログインが必要です" };

  const postId = String(formData.get("postId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!postId) return { error: "投稿が見つかりません" };
  if (!content) return { error: "コメントを入力してください" };
  if (content.length > 500) {
    return { error: "コメントは500文字以内にしてください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: profile.id,
    content,
  });

  if (error) return { error: "コメントの投稿に失敗しました" };

  revalidatePath("/feed");
  return {};
}
