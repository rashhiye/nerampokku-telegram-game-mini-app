// ==============================================================================
// LUDO ENGINE AUTOMATED UNIT TESTS (4P & 6P)
// File: tests/unit/ludo.test.ts
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  createLudoGame,
  applyLudoAction,
  getGlobalTrackIndex,
  LUDO_CONFIG_4P,
  LUDO_CONFIG_6P,
} from "../../frontend/src/games/ludo/engine/ludoEngine";

describe("LUDO Engine: 4-Player Board Mathematics", () => {
  it("should initialize 4 players with 4 tokens in base and correct track config", () => {
    const game = createLudoGame(4);
    expect(game.playerCount).toBe(4);
    expect(game.config.totalOuterSquares).toBe(52);
    expect(game.config.safeSquares.length).toBe(8);

    for (let seat = 0; seat < 4; seat++) {
      const player = game.players[seat];
      expect(player.tokens.length).toBe(4);
      expect(player.tokens.every((t) => t.step === -1 && !t.isHome)).toBe(true);
    }
  });

  it("should calculate correct global track positions for 4 players", () => {
    // Red (Seat 0): Start is 0
    expect(getGlobalTrackIndex(0, 0, LUDO_CONFIG_4P)).toBe(0);
    expect(getGlobalTrackIndex(0, 10, LUDO_CONFIG_4P)).toBe(10);
    expect(getGlobalTrackIndex(0, 50, LUDO_CONFIG_4P)).toBe(50);
    // Home stretch (step >= 51) has no global outer track position
    expect(getGlobalTrackIndex(0, 51, LUDO_CONFIG_4P)).toBeNull();

    // Green (Seat 1): Start is 13
    expect(getGlobalTrackIndex(1, 0, LUDO_CONFIG_4P)).toBe(13);
    expect(getGlobalTrackIndex(1, 40, LUDO_CONFIG_4P)).toBe((13 + 40) % 52); // 53 % 52 = 1

    // Blue (Seat 3): Start is 39
    expect(getGlobalTrackIndex(3, 0, LUDO_CONFIG_4P)).toBe(39);
    expect(getGlobalTrackIndex(3, 15, LUDO_CONFIG_4P)).toBe((39 + 15) % 52); // 54 % 52 = 2
  });
});

describe("LUDO Engine: 6-Player Hexagonal Board Mathematics", () => {
  it("should initialize 6 distinct players with 72-square hexagonal perimeter track", () => {
    const game = createLudoGame(6);
    expect(game.playerCount).toBe(6);
    expect(game.config.totalOuterSquares).toBe(72);
    expect(game.config.safeSquares.length).toBe(12); // 6 starts + 6 stars
    expect(game.config.colors).toEqual([
      "red",
      "green",
      "yellow",
      "blue",
      "orange",
      "purple",
    ]);

    // Check starts spaced 12 squares apart
    expect(game.config.startPositions[0]).toBe(0);  // Red
    expect(game.config.startPositions[1]).toBe(12); // Green
    expect(game.config.startPositions[2]).toBe(24); // Yellow
    expect(game.config.startPositions[3]).toBe(36); // Blue
    expect(game.config.startPositions[4]).toBe(48); // Orange
    expect(game.config.startPositions[5]).toBe(60); // Purple
  });

  it("should calculate correct global track positions for all 6 hexagonal arms", () => {
    expect(getGlobalTrackIndex(0, 0, LUDO_CONFIG_6P)).toBe(0);
    expect(getGlobalTrackIndex(1, 0, LUDO_CONFIG_6P)).toBe(12);
    expect(getGlobalTrackIndex(5, 0, LUDO_CONFIG_6P)).toBe(60);
    // Boundary wrapping
    expect(getGlobalTrackIndex(5, 20, LUDO_CONFIG_6P)).toBe((60 + 20) % 72); // 80 % 72 = 8
  });
});

describe("LUDO Engine: Gameplay, Moves & Dice Rules", () => {
  it("should automatically pass turn if player rolls 1-5 with all tokens in base", () => {
    const game = createLudoGame(4);
    expect(game.currentTurnSeat).toBe(0);

    // Roll a 4 (injected dice)
    const nextState = applyLudoAction(
      game,
      { type: "ROLL_DICE", seat: 0 },
      4 // Injected dice value
    );

    // Cannot move any token from base with a 4 -> turn auto-passes to Seat 1
    expect(nextState.currentTurnSeat).toBe(1);
    expect(nextState.turnPhase).toBe("ROLL");
  });

  it("should release token from base when rolling a 6", () => {
    const game = createLudoGame(4);
    const rolledState = applyLudoAction(
      game,
      { type: "ROLL_DICE", seat: 0 },
      6 // Injected 6
    );

    expect(rolledState.turnPhase).toBe("MOVE");
    expect(rolledState.movableTokenIds.length).toBe(4);

    const movedState = applyLudoAction(rolledState, {
      type: "MOVE_TOKEN",
      seat: 0,
      tokenId: "t_red_0",
    });

    const token = movedState.players[0].tokens[0];
    expect(token.step).toBe(0); // released to start square
    // Rolling 6 awards bonus turn!
    expect(movedState.currentTurnSeat).toBe(0);
    expect(movedState.turnPhase).toBe("ROLL");
  });

  it("should forfeit turn after rolling three consecutive 6s", () => {
    let game = createLudoGame(4);

    // 1st six
    game = applyLudoAction(game, { type: "ROLL_DICE", seat: 0 }, 6);
    game = applyLudoAction(game, { type: "MOVE_TOKEN", seat: 0, tokenId: "t_red_0" });
    expect(game.currentTurnSeat).toBe(0);

    // 2nd six
    game = applyLudoAction(game, { type: "ROLL_DICE", seat: 0 }, 6);
    game = applyLudoAction(game, { type: "MOVE_TOKEN", seat: 0, tokenId: "t_red_1" });
    expect(game.currentTurnSeat).toBe(0);

    // 3rd six -> penalty! Turn forfeited immediately
    game = applyLudoAction(game, { type: "ROLL_DICE", seat: 0 }, 6);
    expect(game.currentTurnSeat).toBe(1); // Turn advanced to Seat 1
    expect(game.consecutiveSixes).toBe(0);
  });
});

describe("LUDO Engine: Captures & Safe Squares", () => {
  it("should capture opponent token on normal square and return it to base", () => {
    const game = createLudoGame(4);

    // Player 0 (Red, start: 0) token at step 5 -> global index 5
    game.players[0].tokens[0].step = 5;

    // Player 1 (Green, start: 13) token at step 44 -> global index (13 + 44) % 52 = 5
    // Let's place Player 1 token at global index 5:
    game.players[1].tokens[0].step = 44; // (13 + 44) % 52 = 57 % 52 = 5

    // Now Player 0 has a token at step 2. Rolling a 3 lands on step 5 (global 5)!
    game.players[0].tokens[1].step = 2;
    game.currentTurnSeat = 0;
    game.turnPhase = "ROLL";

    // Player 0 rolls 3
    const rolled = applyLudoAction(game, { type: "ROLL_DICE", seat: 0 }, 3);
    const afterMove = applyLudoAction(rolled, {
      type: "MOVE_TOKEN",
      seat: 0,
      tokenId: "t_red_1",
    });

    // Player 1's token was captured! Returned to base (step = -1)
    expect(afterMove.players[1].tokens[0].step).toBe(-1);
    // Capturing awards a bonus turn!
    expect(afterMove.currentTurnSeat).toBe(0);
    expect(afterMove.turnPhase).toBe("ROLL");
  });

  it("should NOT capture opponent token on a safe star square", () => {
    const game = createLudoGame(4);
    // Square 8 is a safe star square (in safeSquares)
    // Red (seat 0) at step 8 is global index 8
    game.players[0].tokens[0].step = 8;
    // Green (seat 1, start 13) at step 47 -> (13 + 47) % 52 = 60 % 52 = 8
    game.players[1].tokens[0].step = 47;

    // Both coexist safely on safe square 8
    game.players[0].tokens[1].step = 6;
    game.currentTurnSeat = 0;
    game.turnPhase = "ROLL";

    // Player 0 moves from 6 to 8 (rolls 2)
    const rolled = applyLudoAction(game, { type: "ROLL_DICE", seat: 0 }, 2);
    const afterMove = applyLudoAction(rolled, {
      type: "MOVE_TOKEN",
      seat: 0,
      tokenId: "t_red_1",
    });

    // Player 1's token is SAFE!
    expect(afterMove.players[1].tokens[0].step).toBe(47);
  });
});

describe("LUDO Engine: Home Finish & Victory Conditions", () => {
  it("should require exact dice roll to finish into Home", () => {
    const game = createLudoGame(4);
    // Token is at step 54. Finish step is 56. Needs exactly a 2!
    game.players[0].tokens[0].step = 54;
    game.currentTurnSeat = 0;
    game.turnPhase = "ROLL";

    // Roll a 4 (overshoot)
    const rolled = applyLudoAction(game, { type: "ROLL_DICE", seat: 0 }, 4);
    // Cannot move token 0 because 54 + 4 = 58 > 56
    expect(rolled.movableTokenIds.includes("t_red_0")).toBe(false);
  });

  it("should land token Home on exact roll, increment finishedCount, and award bonus roll", () => {
    const game = createLudoGame(4);
    game.players[0].tokens[0].step = 54;
    game.currentTurnSeat = 0;
    game.turnPhase = "ROLL";

    // Roll an exact 2
    const rolled = applyLudoAction(game, { type: "ROLL_DICE", seat: 0 }, 2);
    expect(rolled.movableTokenIds.includes("t_red_0")).toBe(true);

    const moved = applyLudoAction(rolled, {
      type: "MOVE_TOKEN",
      seat: 0,
      tokenId: "t_red_0",
    });

    expect(moved.players[0].tokens[0].step).toBe(56);
    expect(moved.players[0].tokens[0].isHome).toBe(true);
    expect(moved.players[0].finishedCount).toBe(1);
    // Landing home awards bonus roll!
    expect(moved.currentTurnSeat).toBe(0);
    expect(moved.turnPhase).toBe("ROLL");
  });
});
