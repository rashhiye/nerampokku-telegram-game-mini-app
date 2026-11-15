// ==============================================================================
// UNO GAME ENGINE: TYPE DEFINITIONS
// File: frontend/src/games/uno/engine/types.ts
// ==============================================================================

export type CardColor = "red" | "blue" | "green" | "yellow" | "wild";

export type CardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wild4";

export interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
  score: number;
}

export interface UnoHouseRules {
  allowStackingDraw2: boolean;
  allowStackingDraw4: boolean;
  wildChallengeEnabled: boolean;
  allowJumpIn: boolean;
  allowSevenZero: boolean;
  drawUntilPlayable: boolean;
}

export interface UnoPendingChallenge {
  offenderSeat: number;
  challengerSeat: number;
  activeColorBeforeWild: CardColor;
  drawnCardsCount: number;
}

export interface UnoGameState {
  playerCount: number;
  drawPile: UnoCard[];
  discardPile: UnoCard[];
  activeColor: CardColor;
  activeValue: CardValue;
  playerHands: Record<number, UnoCard[]>;
  currentTurnSeat: number;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  drawStackCount: number;
  unoDeclared: Record<number, boolean>;
  unoCatchWindow: { vulnerableSeat: number; expiresAt: number } | null;
  pendingChallenge: UnoPendingChallenge | null;
  winnerSeat: number | null;
  houseRules: UnoHouseRules;
  history: string[];
}

export type UnoAction =
  | { type: "PLAY_CARD"; seat: number; cardId: string; chosenColor?: CardColor }
  | { type: "DRAW_CARD"; seat: number }
  | { type: "CALL_UNO"; seat: number }
  | { type: "CATCH_UNO"; reporterSeat: number }
  | { type: "DECIDE_CHALLENGE"; challengerSeat: number; challenge: boolean }
  | { type: "PASS_TURN"; seat: number };
