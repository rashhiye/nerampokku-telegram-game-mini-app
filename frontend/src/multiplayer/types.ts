// ==============================================================================
// MULTIPLAYER SESSION TYPES
// File: frontend/src/multiplayer/types.ts
// ==============================================================================

export type GameType = "uno" | "ludo";
export type SessionStatus = "waiting" | "in_progress" | "completed" | "abandoned";

export interface GameSessionInfo {
  id: string;
  groupId: string;
  groupTitle?: string;
  gameType: GameType;
  status: SessionStatus;
  hostId: string;
  hostName?: string;
  minPlayers: number;
  maxPlayers: number;
  currentPlayerCount: number;
  createdAt: string;
}

export interface SessionPlayerInfo {
  id: string;
  profileId: string;
  name: string;
  username?: string;
  avatar?: string;
  seatIndex: number;
  isHost: boolean;
  status: "waiting" | "ready" | "playing" | "disconnected";
}
