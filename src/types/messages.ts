export type MessageType = "text" | "image" | "file";

export type ConversationMember = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  account_type: string;
  last_seen_at: string | null;
  typing_at: string | null;
  is_online: boolean;
};

export type ConversationSummary = {
  id: string;
  other_user: ConversationMember;
  last_message: ChatMessage | null;
  unread_count: number;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  file_url: string | null;
  file_name: string | null;
  file_mime: string | null;
  deleted_at: string | null;
  created_at: string;
  is_own: boolean;
  is_read: boolean;
};

export type MessageSendState = {
  error?: string;
  success?: string;
};

export type MessageSearchResult = {
  message: ChatMessage;
  conversation_id: string;
  other_user_name: string;
};
