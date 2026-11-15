// ==============================================================================
// IN-GAME CHAT TYPES
// File: frontend/src/chat/types.ts
// ==============================================================================

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  seatIndex?: number;
  content: string;
  createdAt: string;
  reactions?: Record<string, number>; // emoji -> count
}

export interface QuickReactionEvent {
  id: string;
  emoji: string;
  senderName: string;
}
