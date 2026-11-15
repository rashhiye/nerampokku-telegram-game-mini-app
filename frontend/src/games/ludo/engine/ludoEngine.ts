// ==============================================================================
// AUTHORITATIVE LUDO GAME ENGINE (4-PLAYER & 6-PLAYER)
// File: frontend/src/games/ludo/engine/ludoEngine.ts
// ==============================================================================

import {
  LudoAction,
  LudoBoardConfig,
  LudoColor,
  LudoGameState,
  LudoPlayer,
  LudoToken,
} from "./types";

// 4-PLAYER CONFIGURATION
export const LUDO_CONFIG_4P: LudoBoardConfig = {
  playerCount: 4,
  colors: ["red", "green", "yellow", "blue"],
  totalOuterSquares: 52,
  stepsPerSector: 13,
  startPositions: {
    0: 0,   // Red
    1: 13,  // Green
    2: 26,  // Yellow
    3: 39,  // Blue
  },
  safeSquares: [0, 8, 13, 21, 26, 34, 39, 47], // 4 starts + 4 stars
  homeStretchLength: 5,
  finishStep: 56, // 51 outer steps (0 to 50) + 5 home stretch (51 to 55) + 1 (56 = Home)
};

// 5-PLAYER CONFIGURATION (PENTAGONAL)
export const LUDO_CONFIG_5P: LudoBoardConfig = {
  playerCount: 5,
  colors: ["red", "green", "yellow", "blue", "purple"],
  totalOuterSquares: 60,
  stepsPerSector: 12,
  startPositions: {
    0: 0,   // Red
    1: 12,  // Green
    2: 24,  // Yellow
    3: 36,  // Blue
    4: 48,  // Purple
  },
  safeSquares: [0, 7, 12, 19, 24, 31, 36, 43, 48, 55], // 5 starts + 5 stars
  homeStretchLength: 5,
  finishStep: 64, // 59 outer steps (0 to 58) + 5 home stretch (59 to 63) + 1 (64 = Home)
};

// 6-PLAYER CONFIGURATION (HEXAGONAL)
export const LUDO_CONFIG_6P: LudoBoardConfig = {
  playerCount: 6,
  colors: ["red", "green", "yellow", "blue", "orange", "purple"],
  totalOuterSquares: 72,
  stepsPerSector: 12,
  startPositions: {
    0: 0,   // Red
    1: 12,  // Green
    2: 24,  // Yellow
    3: 36,  // Blue
    4: 48,  // Orange
    5: 60,  // Purple
  },
  safeSquares: [0, 7, 12, 19, 24, 31, 36, 43, 48, 55, 60, 67], // 6 starts + 6 stars
  homeStretchLength: 5,
  finishStep: 76, // 71 outer steps (0 to 70) + 5 home stretch (71 to 75) + 1 (76 = Home)
};

/**
 * Generates server-authoritative CSPRNG dice roll (1 to 6)
 */
export function rollAuthoritativeDice(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return (arr[0] % 6) + 1;
  }
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Maps a player's relative step to the global perimeter track index.
 * Returns null if token is in Base or in colored Home Stretch.
 */
export function getGlobalTrackIndex(
  seat: number,
  step: number,
  config: LudoBoardConfig
): number | null {
  if (step < 0 || step >= config.totalOuterSquares - 1) {
    return null;
  }
  const startPos = config.startPositions[seat];
  return (startPos + step) % config.totalOuterSquares;
}

/**
 * Initializes a new authoritative Ludo game state.
 */
export function createLudoGame(playerCount: 4 | 5 | 6): LudoGameState {
  const config =
    playerCount === 6
      ? LUDO_CONFIG_6P
      : playerCount === 5
      ? LUDO_CONFIG_5P
      : LUDO_CONFIG_4P;
  const players: Record<number, LudoPlayer> = {};

  for (let seat = 0; seat < playerCount; seat++) {
    const color = config.colors[seat];
    const tokens: LudoToken[] = [];
    for (let t = 0; t < 4; t++) {
      tokens.push({
        id: `t_${color}_${t}`,
        color,
        seat,
        tokenIndex: t,
        step: -1, // in base
        isHome: false,
      });
    }
    players[seat] = {
      seat,
      color,
      tokens,
      finishedCount: 0,
      rank: null,
    };
  }

  return {
    playerCount,
    config,
    players,
    currentTurnSeat: 0,
    currentDiceValue: null,
    consecutiveSixes: 0,
    turnPhase: "ROLL",
    movableTokenIds: [],
    winnerRanking: [],
    history: [`LUDO initialized for ${playerCount} players. Player 0 rolls first.`],
  };
}

/**
 * Checks if a specific token can legally move given the current dice roll.
 */
export function canTokenMove(
  token: LudoToken,
  dice: number,
  config: LudoBoardConfig
): boolean {
  if (token.isHome) return false;

  // In base: needs a 6 to exit to start square (step 0)
  if (token.step === -1) {
    return dice === 6;
  }

  // On track / home stretch
  const newStep = token.step + dice;
  // Must land exactly on or before finishStep
  return newStep <= config.finishStep;
}

/**
 * Computes all legal tokens that can move for the active player.
 */
export function getMovableTokens(
  player: LudoPlayer,
  dice: number,
  config: LudoBoardConfig
): string[] {
  return player.tokens
    .filter((token) => canTokenMove(token, dice, config))
    .map((token) => token.id);
}

/**
 * Advances the turn to the next unfinished player.
 */
export function advanceToNextLudoTurn(state: LudoGameState): void {
  let nextSeat = (state.currentTurnSeat + 1) % state.playerCount;
  let attempts = 0;

  // Skip players who have already finished all 4 tokens
  while (state.players[nextSeat].finishedCount === 4 && attempts < state.playerCount) {
    nextSeat = (nextSeat + 1) % state.playerCount;
    attempts++;
  }

  state.currentTurnSeat = nextSeat;
  state.currentDiceValue = null;
  state.consecutiveSixes = 0;
  state.turnPhase = "ROLL";
  state.movableTokenIds = [];
}

/**
 * Authoritative State Transition Handler for LUDO
 */
export function applyLudoAction(
  prevState: LudoGameState,
  action: LudoAction,
  injectedDice?: number // Allowed for deterministic testing
): LudoGameState {
  const state: LudoGameState = JSON.parse(JSON.stringify(prevState));

  if (state.turnPhase === "GAME_OVER") {
    throw new Error("Game is over.");
  }

  switch (action.type) {
    case "ROLL_DICE": {
      if (action.seat !== state.currentTurnSeat) {
        throw new Error("Not your turn to roll.");
      }
      if (state.turnPhase !== "ROLL") {
        throw new Error("Cannot roll right now.");
      }

      const dice = injectedDice ?? rollAuthoritativeDice();
      state.currentDiceValue = dice;

      // Handle three consecutive sixes rule
      if (dice === 6) {
        state.consecutiveSixes++;
        if (state.consecutiveSixes === 3) {
          state.history.push(
            `Player ${action.seat} rolled three consecutive 6s! Turn forfeited.`
          );
          advanceToNextLudoTurn(state);
          return state;
        }
      } else {
        state.consecutiveSixes = 0;
      }

      state.history.push(`Player ${action.seat} rolled a ${dice}.`);

      // Determine movable tokens
      const activePlayer = state.players[action.seat];
      const movable = getMovableTokens(activePlayer, dice, state.config);
      state.movableTokenIds = movable;

      if (movable.length === 0) {
        // No moves possible -> pass turn immediately
        state.history.push(`No legal moves for Player ${action.seat}. Passing turn.`);
        advanceToNextLudoTurn(state);
      } else {
        state.turnPhase = "MOVE";
      }

      return state;
    }

    case "MOVE_TOKEN": {
      if (action.seat !== state.currentTurnSeat) {
        throw new Error("Not your turn to move.");
      }
      if (state.turnPhase !== "MOVE") {
        throw new Error("Must roll dice before moving.");
      }
      if (!state.movableTokenIds.includes(action.tokenId)) {
        throw new Error("Selected token cannot make a legal move.");
      }

      const dice = state.currentDiceValue!;
      const player = state.players[action.seat];
      const token = player.tokens.find((t) => t.id === action.tokenId)!;

      let bonusTurn = false;

      // Execute movement
      if (token.step === -1) {
        // Exit base to start square
        token.step = 0;
        state.history.push(`Player ${action.seat} moved token out of base to start.`);
      } else {
        token.step += dice;
        state.history.push(`Player ${action.seat} moved token ${dice} steps forward.`);
      }

      // Check if token reached Home
      if (token.step === state.config.finishStep) {
        token.isHome = true;
        player.finishedCount++;
        bonusTurn = true;
        state.history.push(
          `🎯 Player ${action.seat}'s token reached Home! (${player.finishedCount}/4 tokens)`
        );

        // Check if player has finished all tokens
        if (player.finishedCount === 4) {
          player.rank = state.winnerRanking.length + 1;
          state.winnerRanking.push(action.seat);
          state.history.push(`🏆 Player ${action.seat} finished in Rank #${player.rank}!`);

          // If only 1 player remains, game ends
          if (state.winnerRanking.length >= state.playerCount - 1) {
            state.turnPhase = "GAME_OVER";
            return state;
          }
        }
      }

      // Check for Opponent Capture on common perimeter track
      const globalPos = getGlobalTrackIndex(action.seat, token.step, state.config);
      if (globalPos !== null && !state.config.safeSquares.includes(globalPos)) {
        // Inspect all other players' tokens at this position
        for (let otherSeat = 0; otherSeat < state.playerCount; otherSeat++) {
          if (otherSeat === action.seat) continue;
          const otherPlayer = state.players[otherSeat];
          for (const oppToken of otherPlayer.tokens) {
            const oppGlobal = getGlobalTrackIndex(
              otherSeat,
              oppToken.step,
              state.config
            );
            if (oppGlobal === globalPos && !oppToken.isHome) {
              // CAPTURE!
              oppToken.step = -1; // Send back to base
              bonusTurn = true;
              state.history.push(
                `💥 Player ${action.seat} captured Player ${otherSeat}'s token at spot ${globalPos}! Token returned to base.`
              );
            }
          }
        }
      }

      // Bonus turn check: rolling a 6 also awards bonus roll
      if (dice === 6) {
        bonusTurn = true;
      }

      if (bonusTurn && player.finishedCount < 4) {
        state.history.push(`Player ${action.seat} gets a bonus roll!`);
        state.turnPhase = "ROLL";
        state.currentDiceValue = null;
        state.movableTokenIds = [];
      } else {
        advanceToNextLudoTurn(state);
      }

      return state;
    }

    case "PASS_TURN": {
      if (action.seat !== state.currentTurnSeat) {
        throw new Error("Not your turn.");
      }
      advanceToNextLudoTurn(state);
      return state;
    }

    default:
      return state;
  }
}
