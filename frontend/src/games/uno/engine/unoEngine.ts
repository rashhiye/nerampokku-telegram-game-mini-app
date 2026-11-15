// ==============================================================================
// AUTHORITATIVE UNO GAME ENGINE
// File: frontend/src/games/uno/engine/unoEngine.ts
// ==============================================================================

import {
  CardColor,
  CardValue,
  UnoAction,
  UnoCard,
  UnoGameState,
  UnoHouseRules,
} from "./types";

export const DEFAULT_UNO_HOUSE_RULES: UnoHouseRules = {
  allowStackingDraw2: false,
  allowStackingDraw4: false,
  wildChallengeEnabled: true,
  allowJumpIn: false,
  allowSevenZero: false,
  drawUntilPlayable: false,
};

/**
 * Creates a standard 108-card UNO deck.
 */
export function generateUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  const colors: CardColor[] = ["red", "blue", "green", "yellow"];

  let idCounter = 1;

  for (const color of colors) {
    // One '0' per color
    deck.push({
      id: `c_${idCounter++}`,
      color,
      value: "0",
      score: 0,
    });

    // Two of '1' through '9'
    for (let num = 1; num <= 9; num++) {
      const val = num.toString() as CardValue;
      deck.push({ id: `c_${idCounter++}`, color, value: val, score: num });
      deck.push({ id: `c_${idCounter++}`, color, value: val, score: num });
    }

    // Two Skips, Reverses, Draw Twos
    for (let i = 0; i < 2; i++) {
      deck.push({ id: `c_${idCounter++}`, color, value: "skip", score: 20 });
      deck.push({ id: `c_${idCounter++}`, color, value: "reverse", score: 20 });
      deck.push({ id: `c_${idCounter++}`, color, value: "draw2", score: 20 });
    }
  }

  // Four Wilds, Four Wild Draw Fours
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c_${idCounter++}`, color: "wild", value: "wild", score: 50 });
    deck.push({ id: `c_${idCounter++}`, color: "wild", value: "wild4", score: 50 });
  }

  return deck;
}

/**
 * Cryptographic Fisher-Yates shuffle
 */
export function shuffleCards(cards: UnoCard[]): UnoCard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    let rand = Math.random();
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      rand = arr[0] / (0xffffffff + 1);
    }
    const j = Math.floor(rand * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculates next seat in turn sequence
 */
export function getNextSeat(
  currentSeat: number,
  direction: 1 | -1,
  playerCount: number,
  step = 1
): number {
  return (currentSeat + direction * step + playerCount * 100) % playerCount;
}

/**
 * Initialize a new UNO game with dealt hands and initial discard card.
 */
export function createUnoGame(
  playerCount: number,
  houseRules: Partial<UnoHouseRules> = {}
): UnoGameState {
  if (playerCount < 2 || playerCount > 6) {
    throw new Error("UNO supports 2 to 6 players.");
  }

  const mergedRules: UnoHouseRules = { ...DEFAULT_UNO_HOUSE_RULES, ...houseRules };
  let deck = shuffleCards(generateUnoDeck());

  // Deal 7 cards to each seat
  const playerHands: Record<number, UnoCard[]> = {};
  for (let seat = 0; seat < playerCount; seat++) {
    playerHands[seat] = deck.splice(0, 7);
  }

  // Flip top card for discard pile (must not be Wild Draw Four on start)
  let topCard = deck.pop()!;
  while (topCard.value === "wild4") {
    deck.unshift(topCard);
    deck = shuffleCards(deck);
    topCard = deck.pop()!;
  }

  let activeColor = topCard.color === "wild" ? "red" : topCard.color;
  let activeValue = topCard.value;
  let currentTurnSeat = 0;
  let direction: 1 | -1 = 1;
  let drawStackCount = 0;

  // Handle start card action
  if (topCard.value === "skip") {
    currentTurnSeat = getNextSeat(0, direction, playerCount, 1);
  } else if (topCard.value === "reverse") {
    if (playerCount === 2) {
      currentTurnSeat = 1; // 2P reverse acts as skip
    } else {
      direction = -1;
      currentTurnSeat = 0;
    }
  } else if (topCard.value === "draw2") {
    if (mergedRules.allowStackingDraw2) {
      drawStackCount = 2;
    } else {
      playerHands[0].push(...deck.splice(0, 2));
      currentTurnSeat = getNextSeat(0, direction, playerCount, 1);
    }
  }

  return {
    playerCount,
    drawPile: deck,
    discardPile: [topCard],
    activeColor,
    activeValue,
    playerHands,
    currentTurnSeat,
    direction,
    drawStackCount,
    unoDeclared: {},
    unoCatchWindow: null,
    pendingChallenge: null,
    winnerSeat: null,
    houseRules: mergedRules,
    history: [`Game initialized with ${playerCount} players. Top card is ${topCard.color} ${topCard.value}.`],
  };
}

/**
 * Checks if a specific card can be played legally in current state.
 */
export function canPlayCard(
  card: UnoCard,
  state: UnoGameState,
  seat: number
): boolean {
  if (state.winnerSeat !== null || state.pendingChallenge !== null) {
    return false;
  }

  // Stacking rule check
  if (state.drawStackCount > 0) {
    const topCard = state.discardPile[state.discardPile.length - 1];
    if (topCard.value === "draw2" && state.houseRules.allowStackingDraw2) {
      return card.value === "draw2";
    }
    if (topCard.value === "wild4" && state.houseRules.allowStackingDraw4) {
      return card.value === "wild4";
    }
    return false;
  }

  // Check turn ownership
  if (seat !== state.currentTurnSeat) {
    // Jump-In rule check: exact color & value match can play out of turn
    if (state.houseRules.allowJumpIn) {
      return card.color === state.activeColor && card.value === state.activeValue;
    }
    return false;
  }

  // Wild cards are always playable
  if (card.color === "wild") {
    return true;
  }

  // Color or value matching
  return card.color === state.activeColor || card.value === state.activeValue;
}

/**
 * Draws N cards safely from drawPile, recycling discardPile if empty.
 */
export function drawCards(
  drawPile: UnoCard[],
  discardPile: UnoCard[],
  count: number
): { drawn: UnoCard[]; newDrawPile: UnoCard[]; newDiscardPile: UnoCard[] } {
  let curDraw = [...drawPile];
  let curDiscard = [...discardPile];
  const drawn: UnoCard[] = [];

  for (let i = 0; i < count; i++) {
    if (curDraw.length === 0) {
      if (curDiscard.length <= 1) {
        // No cards left to recycle
        break;
      }
      const topDiscard = curDiscard.pop()!;
      curDraw = shuffleCards(curDiscard);
      curDiscard = [topDiscard];
    }
    const card = curDraw.pop();
    if (card) drawn.push(card);
  }

  return { drawn, newDrawPile: curDraw, newDiscardPile: curDiscard };
}

/**
 * Authoritative State Transition Handler
 */
export function applyUnoAction(
  prevState: UnoGameState,
  action: UnoAction
): UnoGameState {
  const state: UnoGameState = JSON.parse(JSON.stringify(prevState));

  if (state.winnerSeat !== null) {
    throw new Error("Match has already finished.");
  }

  // Check if catch window expired
  if (state.unoCatchWindow && Date.now() > state.unoCatchWindow.expiresAt) {
    state.unoCatchWindow = null;
  }

  switch (action.type) {
    case "CALL_UNO": {
      state.unoDeclared[action.seat] = true;
      state.history.push(`Player ${action.seat} declared UNO!`);
      // If they were vulnerable, clearing window
      if (state.unoCatchWindow?.vulnerableSeat === action.seat) {
        state.unoCatchWindow = null;
      }
      return state;
    }

    case "CATCH_UNO": {
      if (
        state.unoCatchWindow &&
        state.unoCatchWindow.vulnerableSeat !== action.reporterSeat
      ) {
        const victimSeat = state.unoCatchWindow.vulnerableSeat;
        const { drawn, newDrawPile, newDiscardPile } = drawCards(
          state.drawPile,
          state.discardPile,
          2
        );
        state.drawPile = newDrawPile;
        state.discardPile = newDiscardPile;
        state.playerHands[victimSeat].push(...drawn);
        state.history.push(
          `Player ${action.reporterSeat} caught Player ${victimSeat} without calling UNO! (+2 cards)`
        );
        state.unoCatchWindow = null;
      }
      return state;
    }

    case "DRAW_CARD": {
      if (action.seat !== state.currentTurnSeat) {
        throw new Error("Not your turn to draw.");
      }

      // If pending draw stack exists
      if (state.drawStackCount > 0) {
        const drawCount = state.drawStackCount;
        const { drawn, newDrawPile, newDiscardPile } = drawCards(
          state.drawPile,
          state.discardPile,
          drawCount
        );
        state.drawPile = newDrawPile;
        state.discardPile = newDiscardPile;
        state.playerHands[action.seat].push(...drawn);
        state.drawStackCount = 0;
        state.history.push(`Player ${action.seat} drew ${drawCount} stacked cards.`);
        state.currentTurnSeat = getNextSeat(
          state.currentTurnSeat,
          state.direction,
          state.playerCount,
          1
        );
        return state;
      }

      // Normal single draw
      const { drawn, newDrawPile, newDiscardPile } = drawCards(
        state.drawPile,
        state.discardPile,
        1
      );
      state.drawPile = newDrawPile;
      state.discardPile = newDiscardPile;
      state.playerHands[action.seat].push(...drawn);

      state.history.push(`Player ${action.seat} drew a card.`);

      // If not drawUntilPlayable, turn advances after drawing
      if (!state.houseRules.drawUntilPlayable) {
        state.currentTurnSeat = getNextSeat(
          state.currentTurnSeat,
          state.direction,
          state.playerCount,
          1
        );
      }
      return state;
    }

    case "PASS_TURN": {
      if (action.seat !== state.currentTurnSeat) {
        throw new Error("Not your turn to pass.");
      }
      state.currentTurnSeat = getNextSeat(
        state.currentTurnSeat,
        state.direction,
        state.playerCount,
        1
      );
      state.history.push(`Player ${action.seat} passed their turn.`);
      return state;
    }

    case "DECIDE_CHALLENGE": {
      if (!state.pendingChallenge) {
        throw new Error("No pending challenge to resolve.");
      }
      if (action.challengerSeat !== state.pendingChallenge.challengerSeat) {
        throw new Error("Only the targeted player can decide on the challenge.");
      }

      const { offenderSeat, challengerSeat, activeColorBeforeWild } =
        state.pendingChallenge;

      if (!action.challenge) {
        // Challenger accepts +4
        const { drawn, newDrawPile, newDiscardPile } = drawCards(
          state.drawPile,
          state.discardPile,
          4
        );
        state.drawPile = newDrawPile;
        state.discardPile = newDiscardPile;
        state.playerHands[challengerSeat].push(...drawn);
        state.history.push(
          `Player ${challengerSeat} accepted the +4 without challenging.`
        );
        state.pendingChallenge = null;
        state.currentTurnSeat = getNextSeat(
          challengerSeat,
          state.direction,
          state.playerCount,
          1
        );
        return state;
      }

      // Check offender's hand for matching color before wild
      const offenderHand = state.playerHands[offenderSeat];
      const hasMatchingColor = offenderHand.some(
        (c) => c.color === activeColorBeforeWild
      );

      if (hasMatchingColor) {
        // Offender played illegally! Offender draws 4
        const { drawn, newDrawPile, newDiscardPile } = drawCards(
          state.drawPile,
          state.discardPile,
          4
        );
        state.drawPile = newDrawPile;
        state.discardPile = newDiscardPile;
        state.playerHands[offenderSeat].push(...drawn);
        state.history.push(
          `Challenge SUCCESSFUL! Player ${offenderSeat} held matching color and drew 4 cards.`
        );
        state.currentTurnSeat = challengerSeat; // Challenger gets their normal turn
      } else {
        // Offender was innocent! Challenger draws 4 + 2 = 6 cards
        const { drawn, newDrawPile, newDiscardPile } = drawCards(
          state.drawPile,
          state.discardPile,
          6
        );
        state.drawPile = newDrawPile;
        state.discardPile = newDiscardPile;
        state.playerHands[challengerSeat].push(...drawn);
        state.history.push(
          `Challenge FAILED! Player ${offenderSeat} was clean. Player ${challengerSeat} drew 6 cards.`
        );
        state.currentTurnSeat = getNextSeat(
          challengerSeat,
          state.direction,
          state.playerCount,
          1
        );
      }

      state.pendingChallenge = null;
      return state;
    }

    case "PLAY_CARD": {
      const hand = state.playerHands[action.seat];
      const cardIndex = hand.findIndex((c) => c.id === action.cardId);
      if (cardIndex === -1) {
        throw new Error("Card not in hand.");
      }

      const card = hand[cardIndex];
      if (!canPlayCard(card, state, action.seat)) {
        throw new Error("Illegal card play.");
      }

      // Validate wild color selection
      if (card.color === "wild") {
        if (
          !action.chosenColor ||
          !["red", "blue", "green", "yellow"].includes(action.chosenColor)
        ) {
          throw new Error("Wild cards require a chosen color.");
        }
      }

      // Remove card from player hand
      hand.splice(cardIndex, 1);
      state.discardPile.push(card);

      const colorBeforeWild = state.activeColor;
      state.activeColor =
        card.color === "wild" ? action.chosenColor! : card.color;
      state.activeValue = card.value;

      state.history.push(
        `Player ${action.seat} played ${card.color} ${card.value}${
          action.chosenColor ? ` (picked ${action.chosenColor})` : ""
        }.`
      );

      // Check for WIN
      if (hand.length === 0) {
        state.winnerSeat = action.seat;
        state.history.push(`🎉 Player ${action.seat} won the match!`);
        return state;
      }

      // Handle UNO Catch Window
      if (hand.length === 1) {
        if (!state.unoDeclared[action.seat]) {
          state.unoCatchWindow = {
            vulnerableSeat: action.seat,
            expiresAt: Date.now() + 3000,
          };
        }
      }
      state.unoDeclared[action.seat] = false; // Reset for future turns

      // Special Card Resolution
      if (card.value === "skip") {
        state.currentTurnSeat = getNextSeat(
          action.seat,
          state.direction,
          state.playerCount,
          2
        );
      } else if (card.value === "reverse") {
        if (state.playerCount === 2) {
          state.currentTurnSeat = getNextSeat(
            action.seat,
            state.direction,
            state.playerCount,
            2
          );
        } else {
          state.direction = (state.direction * -1) as 1 | -1;
          state.currentTurnSeat = getNextSeat(
            action.seat,
            state.direction,
            state.playerCount,
            1
          );
        }
      } else if (card.value === "draw2") {
        if (state.houseRules.allowStackingDraw2) {
          state.drawStackCount += 2;
          state.currentTurnSeat = getNextSeat(
            action.seat,
            state.direction,
            state.playerCount,
            1
          );
        } else {
          const targetSeat = getNextSeat(
            action.seat,
            state.direction,
            state.playerCount,
            1
          );
          const { drawn, newDrawPile, newDiscardPile } = drawCards(
            state.drawPile,
            state.discardPile,
            2
          );
          state.drawPile = newDrawPile;
          state.discardPile = newDiscardPile;
          state.playerHands[targetSeat].push(...drawn);
          state.history.push(`Player ${targetSeat} drew 2 cards and was skipped.`);
          state.currentTurnSeat = getNextSeat(
            action.seat,
            state.direction,
            state.playerCount,
            2
          );
        }
      } else if (card.value === "wild4") {
        const nextTarget = getNextSeat(
          action.seat,
          state.direction,
          state.playerCount,
          1
        );
        if (state.houseRules.wildChallengeEnabled) {
          state.pendingChallenge = {
            offenderSeat: action.seat,
            challengerSeat: nextTarget,
            activeColorBeforeWild: colorBeforeWild,
            drawnCardsCount: 4,
          };
          state.currentTurnSeat = nextTarget;
        } else if (state.houseRules.allowStackingDraw4) {
          state.drawStackCount += 4;
          state.currentTurnSeat = nextTarget;
        } else {
          const { drawn, newDrawPile, newDiscardPile } = drawCards(
            state.drawPile,
            state.discardPile,
            4
          );
          state.drawPile = newDrawPile;
          state.discardPile = newDiscardPile;
          state.playerHands[nextTarget].push(...drawn);
          state.history.push(`Player ${nextTarget} drew 4 cards and was skipped.`);
          state.currentTurnSeat = getNextSeat(
            action.seat,
            state.direction,
            state.playerCount,
            2
          );
        }
      } else {
        // Standard number card
        state.currentTurnSeat = getNextSeat(
          action.seat,
          state.direction,
          state.playerCount,
          1
        );
      }

      return state;
    }

    default:
      return state;
  }
}
