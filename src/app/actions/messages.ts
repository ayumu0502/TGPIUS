"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { isUserOnline } from "@/lib/messages/format";
import type {
  ChatMessage,
  ConversationSummary,
  MessageSearchResult,
  MessageSendState,
  MessageType,
} from "@/types/messages";

const MESSAGE_ERRORS: Record<string, string> = {
  INVALID_MESSAGE_PAIR: "このユーザーとはメッセージを送れません",
  NOT_MEMBER: "会話に参加していません",
  NOT_AUTHENTICATED: "ログインが必要です",
  INVALID_BLOCK_TARGET: "ブロックできないユーザーです",
  INVALID_REPORT_TARGET: "通報できないユーザーです",
  USER_NOT_FOUND: "ユーザーが見つかりません",
  REASON_REQUIRED: "通報理由を5文字以上入力してください",
};

function translateMessageError(message: string): string {
  for (const [code, text] of Object.entries(MESSAGE_ERRORS)) {
    if (message.includes(code)) return text;
  }
  return "メッセージの送信に失敗しました";
}

function mapMessage(
  row: Record<string, unknown>,
  currentUserId: string,
  readMessageIds: Set<string>
): ChatMessage {
  const senderId = String(row.sender_id);
  const deletedAt = row.deleted_at ? String(row.deleted_at) : null;
  return {
    id: String(row.id),
    conversation_id: String(row.conversation_id),
    sender_id: senderId,
    content: deletedAt ? "" : String(row.content ?? ""),
    message_type: row.message_type as MessageType,
    file_url: row.file_url ? String(row.file_url) : null,
    file_name: row.file_name ? String(row.file_name) : null,
    file_mime: row.file_mime ? String(row.file_mime) : null,
    deleted_at: deletedAt,
    created_at: String(row.created_at),
    is_own: senderId === currentUserId,
    is_read: readMessageIds.has(String(row.id)),
  };
}

export async function getTotalUnreadCount(): Promise<number> {
  const current = await getCurrentProfile();
  if (!current) return 0;

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", current.id);

  if (!memberships?.length) return 0;

  let total = 0;
  for (const membership of memberships) {
    const count = await getUnreadCountForConversation(
      String(membership.conversation_id),
      current.id
    );
    total += count;
  }
  return total;
}

async function getUnreadCountForConversation(
  conversationId: string,
  userId: string
): Promise<number> {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("deleted_at", null);

  if (!messages?.length) return 0;

  const messageIds = messages.map((m) => String(m.id));
  const { data: reads } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("user_id", userId)
    .in("message_id", messageIds);

  const readIds = new Set((reads ?? []).map((r) => String(r.message_id)));
  return messageIds.filter((id) => !readIds.has(id)).length;
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const current = await getCurrentProfile();
  if (!current) return [];

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id, typing_at")
    .eq("user_id", current.id);

  if (!memberships?.length) return [];

  const conversationIds = memberships.map((m) => String(m.conversation_id));

  const { data: allMembers } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, typing_at")
    .in("conversation_id", conversationIds);

  const otherUserIds = [
    ...new Set(
      (allMembers ?? [])
        .filter((m) => String(m.user_id) !== current.id)
        .map((m) => String(m.user_id))
    ),
  ];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, account_type, last_seen_at")
    .in("id", otherUserIds);

  const profileMap = new Map((profiles ?? []).map((p) => [String(p.id), p]));

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, updated_at")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  const summaries: ConversationSummary[] = [];

  for (const conv of conversations ?? []) {
    const convId = String(conv.id);
    const otherMember = (allMembers ?? []).find(
      (m) =>
        String(m.conversation_id) === convId &&
        String(m.user_id) !== current.id
    );
    if (!otherMember) continue;

    const profile = profileMap.get(String(otherMember.user_id));
    if (!profile) continue;

    const { data: lastMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastRow = lastMessages?.[0];
    let lastMessage: ChatMessage | null = null;

    if (lastRow) {
      const readIds = await getReadIdsForMessages(
        [String(lastRow.id)],
        current.id
      );
      lastMessage = mapMessage(lastRow, current.id, readIds);
    }

    const unreadCount = await getUnreadCountForConversation(
      convId,
      current.id
    );

    summaries.push({
      id: convId,
      other_user: {
        user_id: String(profile.id),
        name: String(profile.name),
        avatar_url: profile.avatar_url ? String(profile.avatar_url) : null,
        account_type: String(profile.account_type),
        last_seen_at: profile.last_seen_at
          ? String(profile.last_seen_at)
          : null,
        typing_at: otherMember.typing_at
          ? String(otherMember.typing_at)
          : null,
        is_online: isUserOnline(
          profile.last_seen_at ? String(profile.last_seen_at) : null
        ),
      },
      last_message: lastMessage,
      unread_count: unreadCount,
      updated_at: String(conv.updated_at),
    });
  }

  return summaries;
}

async function getReadIdsForMessages(
  messageIds: string[],
  userId: string
): Promise<Set<string>> {
  if (messageIds.length === 0) return new Set();

  const supabase = await createClient();
  const { data: ownReads } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("user_id", userId)
    .in("message_id", messageIds);

  return new Set((ownReads ?? []).map((r) => String(r.message_id)));
}

async function getReadIdsForOwnMessages(
  messageIds: string[],
  otherUserId: string
): Promise<Set<string>> {
  if (messageIds.length === 0) return new Set();

  const supabase = await createClient();
  const { data: reads } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("user_id", otherUserId)
    .in("message_id", messageIds);

  return new Set((reads ?? []).map((r) => String(r.message_id)));
}

export async function getConversationMessages(
  conversationId: string
): Promise<{
  messages: ChatMessage[];
  otherUser: ConversationSummary["other_user"] | null;
} | null> {
  const current = await getCurrentProfile();
  if (!current) return null;

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", current.id)
    .single();

  if (!membership) return null;

  const { data: members } = await supabase
    .from("conversation_members")
    .select("user_id, typing_at")
    .eq("conversation_id", conversationId);

  const otherMember = (members ?? []).find(
    (m) => String(m.user_id) !== current.id
  );
  if (!otherMember) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, account_type, last_seen_at")
    .eq("id", otherMember.user_id)
    .single();

  const { data: rows } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messageIds = (rows ?? []).map((r) => String(r.id));
  const ownMessageIds = (rows ?? [])
    .filter((r) => String(r.sender_id) === current.id)
    .map((r) => String(r.id));

  const otherReadIds = await getReadIdsForOwnMessages(
    ownMessageIds,
    String(otherMember.user_id)
  );

  const messages = (rows ?? []).map((row) => {
    const msg = mapMessage(row, current.id, new Set());
    if (msg.is_own) {
      msg.is_read = otherReadIds.has(msg.id);
    }
    return msg;
  });

  await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });

  return {
    messages,
    otherUser: profile
      ? {
          user_id: String(profile.id),
          name: String(profile.name),
          avatar_url: profile.avatar_url ? String(profile.avatar_url) : null,
          account_type: String(profile.account_type),
          last_seen_at: profile.last_seen_at
            ? String(profile.last_seen_at)
            : null,
          typing_at: otherMember.typing_at
            ? String(otherMember.typing_at)
            : null,
          is_online: isUserOnline(
            profile.last_seen_at ? String(profile.last_seen_at) : null
          ),
        }
      : null,
  };
}

export async function startConversation(
  otherUserId: string
): Promise<{ conversationId?: string; error?: string }> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    p_other_user_id: otherUserId,
  });

  if (error) {
    return { error: translateMessageError(error.message) };
  }

  revalidatePath("/messages");
  return { conversationId: String(data) };
}

export async function sendMessage(
  _prev: MessageSendState | null,
  formData: FormData
): Promise<MessageSendState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!conversationId) return { error: "会話が指定されていません" };

  const supabase = await createClient();

  let messageType: MessageType = "text";
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileMime: string | null = null;

  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      return { error: "ファイルは10MB以下にしてください" };
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      return { error: "JPEG, PNG, WebP, GIF, PDF のみ対応しています" };
    }

    messageType = file.type === "application/pdf" ? "file" : "image";
    fileMime = file.type;
    fileName = file.name;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${current.id}/${conversationId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("message-attachments")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      return { error: "ファイルのアップロードに失敗しました" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("message-attachments").getPublicUrl(path);
    fileUrl = publicUrl;
  }

  if (!content && !fileUrl) {
    return { error: "メッセージを入力してください" };
  }

  if (content.length > 2000) {
    return { error: "メッセージは2000文字以内にしてください" };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: current.id,
    content: content || (messageType === "image" ? "画像" : fileName || "ファイル"),
    message_type: messageType,
    file_url: fileUrl,
    file_name: fileName,
    file_mime: fileMime,
  });

  if (error) {
    return { error: translateMessageError(error.message) };
  }

  await supabase.rpc("set_typing_status", {
    p_conversation_id: conversationId,
    p_is_typing: false,
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  return { success: "sent" };
}

export async function deleteMessage(messageId: string): Promise<MessageSendState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .update({
      deleted_at: new Date().toISOString(),
      content: "",
    })
    .eq("id", messageId)
    .eq("sender_id", current.id);

  if (error) return { error: "削除に失敗しました" };

  revalidatePath("/messages");
  return { success: "deleted" };
}

export async function searchMessages(
  query: string
): Promise<MessageSearchResult[]> {
  const current = await getCurrentProfile();
  if (!current || !query.trim()) return [];

  const supabase = await createClient();
  const conversations = await getConversations();
  const results: MessageSearchResult[] = [];

  for (const conv of conversations) {
    const { data: rows } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .is("deleted_at", null)
      .ilike("content", `%${query.trim()}%`)
      .order("created_at", { ascending: false })
      .limit(5);

    for (const row of rows ?? []) {
      results.push({
        message: mapMessage(row, current.id, new Set()),
        conversation_id: conv.id,
        other_user_name: conv.other_user.name,
      });
    }
  }

  return results.slice(0, 20);
}

export async function setTyping(
  conversationId: string,
  isTyping: boolean
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("set_typing_status", {
    p_conversation_id: conversationId,
    p_is_typing: isTyping,
  });
}

export async function updatePresence(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("update_last_seen");
}

export async function getMessageableAthletes(): Promise<
  { id: string; name: string; sport: string; avatar_url: string | null }[]
> {
  const current = await getCurrentProfile();
  if (!current) return [];

  if (current.account_type !== "fan" && current.account_type !== "sponsor") {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, sport, avatar_url")
    .eq("account_type", "athlete")
    .eq("athlete_review_status", "approved")
    .order("name");

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    sport: String(row.sport ?? ""),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
  }));
}

export async function blockUser(
  blockedUserId: string
): Promise<{ error?: string; success?: string }> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("block_user", {
    p_blocked_id: blockedUserId,
  });

  if (error) return { error: translateMessageError(error.message) };

  revalidatePath("/messages");
  return { success: "ブロックしました" };
}

export async function reportUser(
  reportedUserId: string,
  reason: string,
  contextType = "dm",
  contextId?: string
): Promise<{ error?: string; success?: string }> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("report_user", {
    p_reported_id: reportedUserId,
    p_reason: reason.trim(),
    p_context_type: contextType,
    p_context_id: contextId ?? null,
  });

  if (error) return { error: translateMessageError(error.message) };

  return { success: "通報を受け付けました" };
}
