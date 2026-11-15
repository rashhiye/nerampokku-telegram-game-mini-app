// ==============================================================================
// UNO GAMEPLAY TABLE COMPONENT
// File: frontend/src/games/uno/components/UnoTable.tsx
// ==============================================================================

import React, { useState } from "react";
import { UnoGameState, UnoCard, CardColor } from "../engine/types";
import { UnoCardView } from "./UnoCardView";
import { UnoColorPicker } from "./UnoColorPicker";
import { canPlayCard } from "../engine/unoEngine";
import { haptics } from "../../../telegram/haptics";
import { sounds } from "../../../telegram/audio";
import { RotateCw, RotateCcw, AlertTriangle, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface UnoPlayerInfo {
  seat: number;
  name: string;
  avatar?: string;
  isCurrentUser: boolean;
}

interface UnoTableProps {
  gameState: UnoGameState;
  currentSeat: number;
  players: UnoPlayerInfo[];
  onPlayCard: (cardId: string, chosenColor?: CardColor) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onCatchUno: () => void;
  onDecideChallenge: (challenge: boolean) => void;
  onRematch?: () => void;
}

export const UnoTable: React.FC<UnoTableProps> = ({
  gameState,
  currentSeat,
  players,
  onPlayCard,
  onDrawCard,
  onCallUno,
  onCatchUno,
  onDecideChallenge,
  onRematch,
}) => {
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);

  const myHand = gameState.playerHands[currentSeat] || [];
  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
  const isMyTurn = gameState.currentTurnSeat === currentSeat;
  const isPendingChallengeForMe =
    gameState.pendingChallenge?.challengerSeat === currentSeat;

  // Handle card click
  const handleCardClick = (card: UnoCard) => {
    if (!isMyTurn) return;
    if (!canPlayCard(card, gameState, currentSeat)) return;

    if (card.color === "wild") {
      setPendingWildCardId(card.id);
    } else {
      haptics.impact("medium");
      sounds.playCard();
      onPlayCard(card.id);
    }
  };

  // Color picker selection
  const handleColorSelect = (color: CardColor) => {
    if (pendingWildCardId) {
      haptics.impact("heavy");
      sounds.playCard();
      onPlayCard(pendingWildCardId, color);
      setPendingWildCardId(null);
    }
  };

  // Draw card click
  const handleDrawClick = () => {
    if (!isMyTurn) return;
    haptics.impact("light");
    sounds.drawCard();
    onDrawCard();
  };

  // Call UNO
  const handleCallUnoClick = () => {
    haptics.notification("success");
    sounds.unoCall();
    onCallUno();
  };

  // Trigger confetti on victory
  React.useEffect(() => {
    if (gameState.winnerSeat !== null) {
      sounds.victory();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [gameState.winnerSeat]);

  // Order other players relative to current user for circular table layout
  const otherPlayers = players.filter((p) => p.seat !== currentSeat);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#0A0D14] select-none p-2 sm:p-4">
      {/* 1. Header Bar: Direction & Active Status */}
      <div className="flex items-center justify-between z-10 py-1 px-3 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-xs font-bold text-slate-400">
            {gameState.direction === 1 ? (
              <span className="flex items-center text-indigo-400">
                <RotateCw className="w-3.5 h-3.5 mr-1 animate-spin" style={{ animationDuration: "8s" }} /> Clockwise
              </span>
            ) : (
              <span className="flex items-center text-rose-400">
                <RotateCcw className="w-3.5 h-3.5 mr-1 animate-spin" style={{ animationDuration: "8s" }} /> Counter-CW
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Draw Stack: <span className="text-amber-400 font-bold">+{gameState.drawStackCount}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Catch UNO Alert Button */}
          {gameState.unoCatchWindow && gameState.unoCatchWindow.vulnerableSeat !== currentSeat && (
            <button
              onClick={() => {
                haptics.notification("warning");
                onCatchUno();
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-1 rounded-full animate-bounce shadow-lg flex items-center"
            >
              <AlertTriangle className="w-3 h-3 mr-1" /> CATCH UNO!
            </button>
          )}

          <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
            Turn: <span className="text-white font-bold">{players.find((p) => p.seat === gameState.currentTurnSeat)?.name || `Seat ${gameState.currentTurnSeat}`}</span>
          </div>
        </div>
      </div>

      {/* 2. Opponents Orbit (Top & Sides) */}
      <div className="flex items-center justify-around w-full py-2 z-10">
        {otherPlayers.map((player) => {
          const cardCount = gameState.playerHands[player.seat]?.length || 0;
          const isTurn = gameState.currentTurnSeat === player.seat;

          return (
            <div
              key={player.seat}
              className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 ${
                isTurn ? "bg-indigo-950/80 ring-2 ring-indigo-400 scale-105 shadow-xl" : "bg-slate-900/50"
              }`}
            >
              <div className="relative">
                <img
                  src={player.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60"}
                  alt={player.name}
                  className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover"
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-950 shadow">
                  {cardCount}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-300 mt-1 max-w-[70px] truncate">
                {player.name}
              </span>
              {/* Opponent Mini Card Backs Fan */}
              <div className="flex -space-x-4 mt-1">
                {Array.from({ length: Math.min(cardCount, 4) }).map((_, i) => (
                  <div key={i} className="w-4 h-6 rounded bg-indigo-900 border border-indigo-400/40 shadow-sm" />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Central Table Area: Draw Pile & Discard Pile */}
      <div className="flex-1 flex items-center justify-center relative my-2">
        {/* Active Color Ambient Glow */}
        <div
          className={`absolute w-56 h-56 rounded-full blur-3xl opacity-25 transition-colors duration-500 ${
            gameState.activeColor === "red"
              ? "bg-red-500"
              : gameState.activeColor === "blue"
              ? "bg-blue-500"
              : gameState.activeColor === "green"
              ? "bg-emerald-500"
              : "bg-amber-400"
          }`}
        />

        <div className="flex items-center space-x-6 z-10">
          {/* Draw Pile */}
          <div className="flex flex-col items-center">
            <div
              onClick={handleDrawClick}
              className={`relative cursor-pointer transition-transform active:scale-95 group ${
                isMyTurn ? "hover:scale-105" : "opacity-80"
              }`}
            >
              {/* Stacked effect behind */}
              <div className="absolute top-1 left-1 w-20 h-28 rounded-xl bg-slate-800 border border-slate-700 -rotate-3" />
              <div className="absolute top-0.5 left-0.5 w-20 h-28 rounded-xl bg-indigo-950 border border-indigo-900 rotate-2" />
              <UnoCardView faceDown size="md" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {isMyTurn ? "Tap to Draw" : "Draw Pile"} ({gameState.drawPile.length})
            </span>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center">
            <div className="relative shadow-2xl">
              <UnoCardView card={topDiscard} size="md" />
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active:</span>
              <span
                className={`w-3 h-3 rounded-full border border-white/50 shadow ${
                  gameState.activeColor === "red"
                    ? "bg-red-500"
                    : gameState.activeColor === "blue"
                    ? "bg-blue-500"
                    : gameState.activeColor === "green"
                    ? "bg-emerald-500"
                    : "bg-amber-400"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Challenge Decision Popup if Targeted */}
      {isPendingChallengeForMe && (
        <div className="z-30 bg-amber-950/90 border border-amber-500 p-3 rounded-2xl mx-auto max-w-sm text-center mb-2 animate-bounce-short">
          <p className="text-xs font-bold text-amber-200 mb-2">
            ⚠️ Player {gameState.pendingChallenge?.offenderSeat} played Wild +4! Challenge their hand?
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => onDecideChallenge(true)}
              className="bg-amber-500 text-slate-950 font-black text-xs px-4 py-1.5 rounded-xl shadow active:scale-95"
            >
              Challenge (+4 or +6)
            </button>
            <button
              onClick={() => onDecideChallenge(false)}
              className="bg-slate-800 text-slate-300 font-bold text-xs px-4 py-1.5 rounded-xl border border-slate-700 active:scale-95"
            >
              Accept +4
            </button>
          </div>
        </div>
      )}

      {/* 5. User Hand & Action Controls (Bottom) */}
      <div className="z-20 w-full flex flex-col items-center pb-2">
        {/* Action Controls Row */}
        <div className="flex items-center justify-between w-full max-w-md px-2 mb-2">
          {/* UNO Call Button */}
          <button
            onClick={handleCallUnoClick}
            disabled={myHand.length > 2}
            className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg ${
              myHand.length <= 2
                ? "bg-gradient-to-r from-amber-500 to-rose-600 text-white animate-pulse active:scale-95 ring-2 ring-white/50"
                : "bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed"
            }`}
          >
            🔥 Call UNO!
          </button>

          {isMyTurn && (
            <span className="text-xs font-extrabold text-cyan-400 animate-pulse bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800">
              Your Turn — Select a card or draw!
            </span>
          )}
        </div>

        {/* Hand Cards Scrollable Tray */}
        <div className="w-full overflow-x-auto pb-2 flex items-center justify-start sm:justify-center space-x-1 sm:space-x-2 px-4 scrollbar-thin">
          {myHand.map((card) => {
            const playable = isMyTurn && canPlayCard(card, gameState, currentSeat);
            return (
              <div key={card.id} className="flex-shrink-0 transition-transform">
                <UnoCardView
                  card={card}
                  isPlayable={playable}
                  onClick={() => handleCardClick(card)}
                  size="md"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Wild Color Selection Modal */}
      <UnoColorPicker
        isOpen={pendingWildCardId !== null}
        onSelectColor={handleColorSelect}
      />

      {/* Victory Celebration Modal */}
      {gameState.winnerSeat !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161B26] border-2 border-amber-500/60 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl font-black text-white mb-1">
              {gameState.winnerSeat === currentSeat ? "🎉 YOU WON!" : `Player ${gameState.winnerSeat} Won!`}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Match completed in {gameState.history.length} moves.
            </p>
            {onRematch && (
              <button
                onClick={onRematch}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-2xl shadow-lg transition-transform active:scale-95"
              >
                Play Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
