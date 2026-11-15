// ==============================================================================
// UNO ENGINE AUTOMATED UNIT TESTS
// File: tests/unit/uno.test.ts
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  generateUnoDeck,
  createUnoGame,
  canPlayCard,
  applyUnoAction,
  getNextSeat,
} from "../../frontend/src/games/uno/engine/unoEngine";
import { UnoCard, UnoGameState } from "../../frontend/src/games/uno/engine/types";

describe("UNO Engine: Deck Generation & Setup", () => {
  it("should generate a standard 108-card deck with exact distributions", () => {
    const deck = generateUnoDeck();
    expect(deck.length).toBe(108);

    const redCards = deck.filter((c) => c.color === "red");
    const blueCards = deck.filter((c) => c.color === "blue");
    const greenCards = deck.filter((c) => c.color === "green");
    const yellowCards = deck.filter((c) => c.color === "yellow");
    const wildCards = deck.filter((c) => c.color === "wild");

    expect(redCards.length).toBe(25);
    expect(blueCards.length).toBe(25);
    expect(greenCards.length).toBe(25);
    expect(yellowCards.length).toBe(25);
    expect(wildCards.length).toBe(8); // 4 Wild + 4 Wild Draw Four

    // Verify exactly one '0' per color
    expect(redCards.filter((c) => c.value === "0").length).toBe(1);
    // Verify exactly two '1's per color
    expect(redCards.filter((c) => c.value === "1").length).toBe(2);
    // Verify exactly 4 Wild and 4 Wild4
    expect(wildCards.filter((c) => c.value === "wild").length).toBe(4);
    expect(wildCards.filter((c) => c.value === "wild4").length).toBe(4);
  });

  it("should initialize a 4-player game with 7 cards each and valid top card", () => {
    const game = createUnoGame(4);
    expect(game.playerCount).toBe(4);
    expect(game.playerHands[0].length).toBe(7);
    expect(game.playerHands[1].length).toBe(7);
    expect(game.playerHands[2].length).toBe(7);
    expect(game.playerHands[3].length).toBe(7);
    expect(game.discardPile.length).toBe(1);
    expect(game.discardPile[0].value).not.toBe("wild4");
    // Draw pile has remaining cards: 108 - (4 * 7) - 1 = 79
    expect(game.drawPile.length).toBe(79);
  });
});

describe("UNO Engine: Turn Direction & Movement", () => {
  it("should compute next seats clockwise and counter-clockwise correctly", () => {
    // 4 players, clockwise (1)
    expect(getNextSeat(0, 1, 4, 1)).toBe(1);
    expect(getNextSeat(3, 1, 4, 1)).toBe(0);
    // 4 players, counter-clockwise (-1)
    expect(getNextSeat(0, -1, 4, 1)).toBe(3);
    expect(getNextSeat(1, -1, 4, 1)).toBe(0);
    // Step 2 (Skip)
    expect(getNextSeat(0, 1, 4, 2)).toBe(2);
    expect(getNextSeat(3, 1, 4, 2)).toBe(1);
  });
});

describe("UNO Engine: Legal Card Play", () => {
  it("should allow matching color or matching value or wild cards", () => {
    const state = createUnoGame(4);
    state.currentTurnSeat = 0;
    state.activeColor = "red";
    state.activeValue = "5";

    const redThree: UnoCard = { id: "t1", color: "red", value: "3", score: 3 };
    const blueFive: UnoCard = { id: "t2", color: "blue", value: "5", score: 5 };
    const greenEight: UnoCard = { id: "t3", color: "green", value: "8", score: 8 };
    const wildCard: UnoCard = { id: "t4", color: "wild", value: "wild", score: 50 };

    expect(canPlayCard(redThree, state, 0)).toBe(true); // matching color
    expect(canPlayCard(blueFive, state, 0)).toBe(true); // matching value
    expect(canPlayCard(wildCard, state, 0)).toBe(true); // wild always legal
    expect(canPlayCard(greenEight, state, 0)).toBe(false); // mismatched
  });

  it("should prevent players from playing out of turn unless jump-in is active", () => {
    const state = createUnoGame(4);
    state.currentTurnSeat = 0;
    state.activeColor = "red";
    state.activeValue = "5";

    const redFive: UnoCard = { id: "t1", color: "red", value: "5", score: 5 };
    expect(canPlayCard(redFive, state, 1)).toBe(false);

    // With jump-in enabled, exact match can jump in
    state.houseRules.allowJumpIn = true;
    expect(canPlayCard(redFive, state, 1)).toBe(true);
  });
});

describe("UNO Engine: Action Cards & Special Rules", () => {
  it("should skip the next player when a Skip card is played", () => {
    const state = createUnoGame(4);
    state.direction = 1;
    state.currentTurnSeat = 0;
    state.activeColor = "blue";
    state.activeValue = "2";

    const skipCard: UnoCard = { id: "skip_1", color: "blue", value: "skip", score: 20 };
    const extraCard: UnoCard = { id: "extra_1", color: "blue", value: "3", score: 3 };
    state.playerHands[0] = [skipCard, extraCard];

    const nextState = applyUnoAction(state, {
      type: "PLAY_CARD",
      seat: 0,
      cardId: "skip_1",
    });

    // Seat 1 skipped, turn goes to Seat 2
    expect(nextState.currentTurnSeat).toBe(2);
  });

  it("should reverse turn direction in 4-player game", () => {
    const state = createUnoGame(4);
    state.currentTurnSeat = 0;
    state.direction = 1;
    state.activeColor = "green";
    state.activeValue = "7";

    const reverseCard: UnoCard = { id: "rev_1", color: "green", value: "reverse", score: 20 };
    state.playerHands[0] = [reverseCard, { id: "dummy", color: "green", value: "1", score: 1 }];

    const nextState = applyUnoAction(state, {
      type: "PLAY_CARD",
      seat: 0,
      cardId: "rev_1",
    });

    expect(nextState.direction).toBe(-1);
    expect(nextState.currentTurnSeat).toBe(3); // (0 - 1) % 4 = 3
  });

  it("should force next player to draw 2 cards and skip when Draw Two played without stacking", () => {
    const state = createUnoGame(4, { allowStackingDraw2: false });
    state.direction = 1;
    state.currentTurnSeat = 0;
    state.activeColor = "yellow";
    state.activeValue = "4";

    const drawTwoCard: UnoCard = { id: "d2_1", color: "yellow", value: "draw2", score: 20 };
    state.playerHands[0] = [drawTwoCard, { id: "dummy", color: "yellow", value: "1", score: 1 }];
    const initialSeat1HandSize = state.playerHands[1].length;

    const nextState = applyUnoAction(state, {
      type: "PLAY_CARD",
      seat: 0,
      cardId: "d2_1",
    });

    // Seat 1 drew 2 cards and was skipped
    expect(nextState.playerHands[1].length).toBe(initialSeat1HandSize + 2);
    expect(nextState.currentTurnSeat).toBe(2);
  });

  it("should handle Wild Draw Four challenge correctly", () => {
    const state = createUnoGame(4, { wildChallengeEnabled: true });
    state.direction = 1;
    state.currentTurnSeat = 0;
    state.activeColor = "red";
    state.activeValue = "3";

    // Player 0 plays Wild4 while illegally holding a red card!
    const wild4: UnoCard = { id: "w4", color: "wild", value: "wild4", score: 50 };
    const redCard: UnoCard = { id: "red_held", color: "red", value: "9", score: 9 };
    const dummyCard: UnoCard = { id: "dummy_card", color: "blue", value: "1", score: 1 };
    state.playerHands[0] = [wild4, redCard, dummyCard];

    const stateAfterPlay = applyUnoAction(state, {
      type: "PLAY_CARD",
      seat: 0,
      cardId: "w4",
      chosenColor: "blue",
    });

    expect(stateAfterPlay.pendingChallenge).not.toBeNull();
    expect(stateAfterPlay.pendingChallenge?.offenderSeat).toBe(0);
    expect(stateAfterPlay.pendingChallenge?.challengerSeat).toBe(1);

    // Player 1 challenges
    const stateAfterChallenge = applyUnoAction(stateAfterPlay, {
      type: "DECIDE_CHALLENGE",
      challengerSeat: 1,
      challenge: true,
    });

    // Challenge should succeed because player 0 had a red card
    // Player 0 draws 4 cards (starts with 2 remaining cards + 4 penalty = 6)
    expect(stateAfterChallenge.playerHands[0].length).toBe(2 + 4);
    expect(stateAfterChallenge.currentTurnSeat).toBe(1); // Player 1 gets their turn
  });

  it("should catch a player with 1 card who failed to declare UNO", () => {
    const state = createUnoGame(4);
    state.currentTurnSeat = 0;
    state.activeColor = "red";
    state.activeValue = "1";

    // Player 0 has 2 cards, plays 1 without calling UNO
    const cardToPlay: UnoCard = { id: "p1", color: "red", value: "2", score: 2 };
    const lastCard: UnoCard = { id: "p2", color: "blue", value: "5", score: 5 };
    state.playerHands[0] = [cardToPlay, lastCard];

    const stateAfterPlay = applyUnoAction(state, {
      type: "PLAY_CARD",
      seat: 0,
      cardId: "p1",
    });

    expect(stateAfterPlay.unoCatchWindow).not.toBeNull();
    expect(stateAfterPlay.unoCatchWindow?.vulnerableSeat).toBe(0);

    // Player 2 catches Player 0
    const stateAfterCatch = applyUnoAction(stateAfterPlay, {
      type: "CATCH_UNO",
      reporterSeat: 2,
    });

    // Player 0 penalized with 2 cards
    expect(stateAfterCatch.playerHands[0].length).toBe(3); // 1 remaining + 2 penalty
    expect(stateAfterCatch.unoCatchWindow).toBeNull();
  });

  it("should declare winner when last card is played", () => {
    const state = createUnoGame(4);
    state.currentTurnSeat = 0;
    state.activeColor = "blue";
    state.activeValue = "8";

    const winningCard: UnoCard = { id: "win_c", color: "blue", value: "8", score: 8 };
    state.playerHands[0] = [winningCard];

    const finalState = applyUnoAction(state, {
      type: "PLAY_CARD",
      seat: 0,
      cardId: "win_c",
    });

    expect(finalState.winnerSeat).toBe(0);
  });
});
