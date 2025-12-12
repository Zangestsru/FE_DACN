export interface ChatMessage {
  messageId: number;
  roomId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
  attachmentName?: string;
  replyToMessageId?: number;
  replyToMessage?: ChatMessage;
  sentAt: Date | string;
  isEdited: boolean;
  editedAt?: Date | string;
}

export interface ChatRoom {
  roomId: number;
  name: string;
  description?: string;
  roomType: 'general' | 'course' | 'exam' | 'private' | 'support';
  createdBy: number;
  creatorName: string;
  createdAt: Date | string;
  isActive: boolean;
  memberCount: number;
  lastMessage?: ChatMessage;
}

export interface SendMessageRequest {
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
  attachmentName?: string;
  replyToMessageId?: number;
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  roomType?: 'general' | 'support';
}

export interface ChatHistoryResponse {
  room: ChatRoom;
  messages: ChatMessage[];
  totalMessages: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

// SignalR Events
export interface UserTypingEvent {
  userId: number;
  userName: string;
  roomId: number;
}

export interface UserOnlineStatusEvent {
  userId: number;
  isOnline: boolean;
  roomId: number;
}

export interface NotificationItem {
  NotificationId: number;
  Title: string;
  Message: string;
  Type?: string | null;
  CreatedAt: string | Date;
  IsRead: boolean;
}
