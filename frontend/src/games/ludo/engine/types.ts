// ==============================================================================
// LUDO GAME ENGINE: TYPE DEFINITIONS
// File: frontend/src/games/ludo/engine/types.ts
// ==============================================================================

export type LudoColor =
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "orange"
  | "purple";

export interface LudoToken {
  id: string; // e.g. "t_red_0"
  color: LudoColor;
  seat: number;
  tokenIndex: number; // 0, 1, 2, 3
  step: number; // -1 = base, 0 = start, ... FinishStep = home
  isHome: boolean;
}

export interface LudoBoardConfig {
  playerCount: 4 | 6;
  colors: LudoColor[];
  totalOuterSquares: number;
  stepsPerSector: number;
  startPositions: Record<number, number>; // seat -> track index
  safeSquares: number[]; // global track indices that are safe
  homeStretchLength: number; // 5 squares
  finishStep: number; // exact step to finish
}

export interface LudoPlayer {
  seat: number;
  color: LudoColor;
  tokens: LudoToken[];
  finishedCount: number;
  rank: number | null; // 1st, 2nd, 3rd place
}

export interface LudoGameState {
  playerCount: 4 | 6;
  config: LudoBoardConfig;
  players: Record<number, LudoPlayer>;
  currentTurnSeat: number;
  currentDiceValue: number | null;
  consecutiveSixes: number;
  turnPhase: "ROLL" | "MOVE" | "GAME_OVER";
  movableTokenIds: string[];
  winnerRanking: number[]; // seats in order of finish
  history: string[];
}

export type LudoAction =
  | { type: "ROLL_DICE"; seat: number }
  | { type: "MOVE_TOKEN"; seat: number; tokenId: string }
  | { type: "PASS_TURN"; seat: number };
