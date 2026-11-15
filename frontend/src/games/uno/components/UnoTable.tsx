// ==============================================================================
// UNO GAMEPLAY TABLE COMPONENT (AUTHENTIC POLISHED REFERENCE DESIGN)
// File: frontend/src/games/uno/components/UnoTable.tsx
// ==============================================================================

import React, { useState, useEffect } from "react";
import { UnoGameState, UnoCard, CardColor } from "../engine/types";
import { UnoCardView } from "./UnoCardView";
import { UnoColorPicker } from "./UnoColorPicker";
import { canPlayCard } from "../engine/unoEngine";
import { haptics } from "../../../telegram/haptics";
import { sounds } from "../../../telegram/audio";
import { getPlayerAvatar } from "../../../utils/avatar";
import { RotateCw, RotateCcw, AlertTriangle, LogOut, X, ShieldAlert } from "lucide-react";
import confetti from "canvas-confetti";

export interface UnoPlayerInfo {
  seat: number;
  name: string;
  avatar?: string;
  isCurrentUser: boolean;
}

interface UnoTableProps {
  gameState: UnoGameState;
  currentSeat: number;
  players: UnoPlayerInfo[];
  speechBubbles?: Record<number, { text: string; expiresAt: number }>;
  isHost?: boolean;
  onPlayCard: (cardId: string, chosenColor?: CardColor) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onCatchUno: () => void;
  onDecideChallenge: (challenge: boolean) => void;
  onRematch?: () => void;
  onLeaveMatch?: () => void;
  onCloseMatch?: () => void;
}

export const UnoTable: React.FC<UnoTableProps> = ({
  gameState,
  currentSeat,
  players,
  speechBubbles = {},
  isHost = false,
  onPlayCard,
  onDrawCard,
  onCallUno,
  onCatchUno,
  onDecideChallenge,
  onRematch,
  onLeaveMatch,
  onCloseMatch,
}) => {
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const myHand = gameState.playerHands[currentSeat] || [];
  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
  const isMyTurn = gameState.currentTurnSeat === currentSeat;
  const isPendingChallengeForMe =
    gameState.pendingChallenge?.challengerSeat === currentSeat;

  // Active player info
  const activePlayer = players.find((p) => p.seat === gameState.currentTurnSeat);
  const activePlayerName = activePlayer?.name || `Seat ${gameState.currentTurnSeat + 1}`;

  // Handle card click
  const handleCardClick = (card: UnoCard) => {
    if (!isMyTurn) return;
    if (!canPlayCard(card, gameState, currentSeat)) {
      haptics.notification("warning");
      return;
    }

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
  useEffect(() => {
    if (gameState.winnerSeat !== null) {
      sounds.victory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [gameState.winnerSeat]);

  // Seating relative to current user (Top, Left, Right)
  const otherPlayers = players.filter((p) => p.seat !== currentSeat);
  const topOpponent = otherPlayers[0];
  const leftOpponent = otherPlayers.length >= 2 ? otherPlayers[1] : null;
  const rightOpponent = otherPlayers.length >= 3 ? otherPlayers[2] : null;
  const currentUserInfo = players.find((p) => p.seat === currentSeat);

  // Check if current user has 2 cards (needs to call UNO)
  const shouldPromptUno = myHand.length === 2 && !gameState.unoDeclared[currentSeat];

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#38166D] select-none text-slate-100 font-['Outfit',sans-serif]">
      {/* Geometric SVG Background Pattern (Matching Reference Image 1) */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="scatter-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <polygon points="10,10 25,10 17,25" fill="none" stroke="#FFF" strokeWidth="1.5" />
              <circle cx="45" cy="45" r="4" fill="none" stroke="#FFF" strokeWidth="1.5" />
              <polygon points="50,15 58,25 42,25" fill="none" stroke="#FFF" strokeWidth="1" />
              <rect x="15" y="42" width="6" height="6" fill="none" stroke="#FFF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#scatter-pattern)" />
        </svg>
      </div>

      {/* 1. Header Bar: Direction, Turn Status & Exit Button */}
      <div className="relative z-20 flex items-center justify-between px-3 py-1.5 bg-[#250B4B]/80 backdrop-blur-md border-b border-purple-500/30 shadow-md">
        <div className="flex items-center space-x-2">
          {/* Turn Direction Badge */}
          <div className="flex items-center text-xs font-bold text-purple-200">
            {gameState.direction === 1 ? (
              <span className="flex items-center text-indigo-300">
                <RotateCw className="w-3.5 h-3.5 mr-1 animate-spin" style={{ animationDuration: "10s" }} /> Clockwise
              </span>
            ) : (
              <span className="flex items-center text-rose-300">
                <RotateCcw className="w-3.5 h-3.5 mr-1 animate-spin" style={{ animationDuration: "10s" }} /> Counter-CW
              </span>
            )}
          </div>

          {/* Draw stack penalty if active */}
          {gameState.drawStackCount > 0 && (
            <span className="text-xs font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500 animate-pulse">
              +{gameState.drawStackCount} Penalty!
            </span>
          )}
        </div>

        {/* Turn Status Banner */}
        <div className="flex items-center space-x-2">
          {/* Catch UNO Alert Button */}
          {gameState.unoCatchWindow && gameState.unoCatchWindow.vulnerableSeat !== currentSeat && (
            <button
              onClick={() => {
                haptics.notification("warning");
                onCatchUno();
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-1 rounded-full animate-bounce shadow-xl flex items-center border border-white"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> CATCH UNO!
            </button>
          )}

          <div
            className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow transition-all ${
              isMyTurn
                ? "bg-emerald-500 text-slate-950 border-white ring-2 ring-emerald-300 animate-pulse"
                : "bg-purple-950/80 border-purple-400/40 text-purple-200"
            }`}
          >
            {isMyTurn ? "🟢 YOUR TURN!" : `⏳ ${activePlayerName}'s Turn`}
          </div>

          {/* Exit Match Button */}
          <button
            onClick={() => setShowExitModal(true)}
            className="p-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-500/30 active:scale-95 transition-transform"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. TOP OPPONENT (Centered at Top) */}
      {topOpponent && (
        <div className="relative z-10 flex flex-col items-center pt-1">
          {/* Speech Bubble */}
          {speechBubbles[topOpponent.seat] && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-slate-950 font-black text-xs px-3 py-1 rounded-2xl shadow-2xl border border-slate-300 whitespace-nowrap animate-bounce z-30 pointer-events-none">
              {speechBubbles[topOpponent.seat].text}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
            </div>
          )}

          {/* Horizontal Mini Card Fan */}
          <div className="flex -space-x-3 mb-1">
            {Array.from({ length: Math.min(gameState.playerHands[topOpponent.seat]?.length || 0, 8) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-8 rounded bg-[#121622] border border-white/80 shadow-md flex items-center justify-center overflow-hidden"
              >
                <div className="w-3.5 h-5 rounded-full bg-red-600 -rotate-20" />
              </div>
            ))}
          </div>

          {/* Avatar with Turn Glow Ring */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <img
                src={getPlayerAvatar(topOpponent.avatar, topOpponent.name, topOpponent.seat.toString())}
                alt={topOpponent.name}
                className={`w-11 h-11 rounded-full object-cover border-2 shadow-xl transition-all ${
                  gameState.currentTurnSeat === topOpponent.seat
                    ? "border-amber-400 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#38166D] animate-pulse scale-110"
                    : "border-purple-400/60"
                }`}
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                {gameState.playerHands[topOpponent.seat]?.length || 0}
              </span>
            </div>
            <span className="text-xs font-black text-white drop-shadow max-w-[90px] truncate">
              {topOpponent.name}
            </span>
          </div>
        </div>
      )}

      {/* 3. MIDDLE ZONE: Left Opponent, Circular Play Area, Right Opponent */}
      <div className="relative z-10 flex-1 flex items-center justify-between px-2 sm:px-6 my-1">
        {/* LEFT OPPONENT */}
        <div className="w-20 flex flex-col items-center">
          {leftOpponent ? (
            <div className="relative flex flex-col items-center">
              {/* Speech Bubble */}
              {speechBubbles[leftOpponent.seat] && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-slate-950 font-black text-xs px-2.5 py-1 rounded-2xl shadow-2xl border border-slate-300 whitespace-nowrap animate-bounce z-30 pointer-events-none">
                  {speechBubbles[leftOpponent.seat].text}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                </div>
              )}

              {/* Vertical Card Fan */}
              <div className="flex flex-col -space-y-4 mb-1">
                {Array.from({ length: Math.min(gameState.playerHands[leftOpponent.seat]?.length || 0, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-5 rounded bg-[#121622] border border-white/80 shadow-md flex items-center justify-center"
                  >
                    <div className="w-5 h-3.5 rounded-full bg-red-600 rotate-12" />
                  </div>
                ))}
              </div>

              <div className="relative">
                <img
                  src={getPlayerAvatar(leftOpponent.avatar, leftOpponent.name, leftOpponent.seat.toString())}
                  alt={leftOpponent.name}
                  className={`w-11 h-11 rounded-full object-cover border-2 shadow-xl transition-all ${
                    gameState.currentTurnSeat === leftOpponent.seat
                      ? "border-amber-400 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#38166D] animate-pulse scale-110"
                      : "border-purple-400/60"
                  }`}
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                  {gameState.playerHands[leftOpponent.seat]?.length || 0}
                </span>
              </div>
              <span className="text-[11px] font-black text-white drop-shadow mt-1 text-center truncate max-w-[80px]">
                {leftOpponent.name}
              </span>
            </div>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* CENTER CIRCULAR PLAY ZONE (Yellow Ring Matching Reference Image 1) */}
        <div className="relative flex items-center justify-center">
          {/* Yellow Circular Play Ring */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-amber-400/90 shadow-2xl flex items-center justify-center bg-purple-950/40 backdrop-blur-xs">
            {/* Ambient Active Color Glow */}
            <div
              className={`absolute inset-4 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${
                gameState.activeColor === "red"
                  ? "bg-red-500"
                  : gameState.activeColor === "blue"
                  ? "bg-blue-500"
                  : gameState.activeColor === "green"
                  ? "bg-emerald-500"
                  : "bg-amber-400"
              }`}
            />

            <div className="flex items-center space-x-3 sm:space-x-5 z-10">
              {/* Draw Pile (Tilted Face Down) */}
              <div
                onClick={handleDrawClick}
                className={`relative cursor-pointer transition-transform active:scale-90 ${
                  isMyTurn ? "hover:scale-105" : "opacity-90"
                }`}
              >
                {/* 3D Stack Effect */}
                <div className="absolute top-1 left-1 w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-slate-900 border border-slate-700 -rotate-6 shadow-md" />
                <div className="absolute top-0.5 left-0.5 w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-indigo-950 border border-indigo-800 rotate-3 shadow-md" />
                <UnoCardView faceDown size="md" />
                {isMyTurn && (
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-300 uppercase whitespace-nowrap drop-shadow bg-slate-950/80 px-1.5 py-0.5 rounded-full border border-amber-400">
                    Draw
                  </span>
                )}
              </div>

              {/* Discard Pile (Active Card, Tilted Face Up) */}
              <div className="relative transform rotate-6 shadow-2xl">
                <UnoCardView card={topDiscard} size="md" />
              </div>
            </div>
          </div>

          {/* Iconic Yellow Oval UNO Button (Matching Reference Image 1) */}
          <button
            onClick={handleCallUnoClick}
            className={`absolute -bottom-2 right-0 sm:right-2 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-red-600 font-black text-sm tracking-tighter uppercase shadow-2xl border-2 border-white transition-transform active:scale-90 ${
              shouldPromptUno
                ? "animate-bounce ring-4 ring-red-500 scale-110"
                : "hover:scale-105"
            }`}
          >
            UNO!
          </button>
        </div>

        {/* RIGHT OPPONENT */}
        <div className="w-20 flex flex-col items-center">
          {rightOpponent ? (
            <div className="relative flex flex-col items-center">
              {/* Speech Bubble */}
              {speechBubbles[rightOpponent.seat] && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-slate-950 font-black text-xs px-2.5 py-1 rounded-2xl shadow-2xl border border-slate-300 whitespace-nowrap animate-bounce z-30 pointer-events-none">
                  {speechBubbles[rightOpponent.seat].text}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                </div>
              )}

              {/* Vertical Card Fan */}
              <div className="flex flex-col -space-y-4 mb-1">
                {Array.from({ length: Math.min(gameState.playerHands[rightOpponent.seat]?.length || 0, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-5 rounded bg-[#121622] border border-white/80 shadow-md flex items-center justify-center"
                  >
                    <div className="w-5 h-3.5 rounded-full bg-red-600 -rotate-12" />
                  </div>
                ))}
              </div>

              <div className="relative">
                <img
                  src={getPlayerAvatar(rightOpponent.avatar, rightOpponent.name, rightOpponent.seat.toString())}
                  alt={rightOpponent.name}
                  className={`w-11 h-11 rounded-full object-cover border-2 shadow-xl transition-all ${
                    gameState.currentTurnSeat === rightOpponent.seat
                      ? "border-amber-400 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#38166D] animate-pulse scale-110"
                      : "border-purple-400/60"
                  }`}
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                  {gameState.playerHands[rightOpponent.seat]?.length || 0}
                </span>
              </div>
              <span className="text-[11px] font-black text-white drop-shadow mt-1 text-center truncate max-w-[80px]">
                {rightOpponent.name}
              </span>
            </div>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* 4. CURRENT USER BOTTOM HAND & CONTROLS */}
      <div className="relative z-20 w-full pb-2 px-2 bg-gradient-to-t from-sky-950/90 via-purple-950/80 to-transparent pt-3 rounded-t-3xl border-t border-purple-500/20">
        {/* User Status Bar & Speech Bubble */}
        <div className="flex items-center justify-between max-w-md mx-auto px-2 mb-2">
          <div className="relative flex items-center space-x-2">
            {/* Speech Bubble */}
            {speechBubbles[currentSeat] && (
              <div className="absolute -top-8 left-6 bg-white text-slate-950 font-black text-xs px-2.5 py-1 rounded-2xl shadow-2xl border border-slate-300 whitespace-nowrap animate-bounce z-30 pointer-events-none">
                {speechBubbles[currentSeat].text}
                <div className="absolute top-full left-4 border-4 border-transparent border-t-white" />
              </div>
            )}

            <div className="relative">
              <img
                src={getPlayerAvatar(currentUserInfo?.avatar, currentUserInfo?.name, currentSeat.toString())}
                alt="You"
                className={`w-10 h-10 rounded-full object-cover border-2 shadow-xl ${
                  isMyTurn ? "border-amber-400 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#38166D] animate-pulse" : "border-slate-400"
                }`}
              />
            </div>
            <div>
              <span className="text-xs font-black text-white">
                {currentUserInfo?.name || "You"} (You)
              </span>
              <div className="text-[10px] font-bold text-amber-300">
                {myHand.length} {myHand.length === 1 ? "Card Left!" : "Cards"}
              </div>
            </div>
          </div>

          {/* Quick UNO Call Button if available */}
          {shouldPromptUno && (
            <button
              onClick={handleCallUnoClick}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-xl animate-pulse border border-white"
            >
              ⚠️ CALL UNO NOW!
            </button>
          )}
        </div>

        {/* Fanned / Overlapping Cards Tray */}
        <div className="flex items-center justify-center overflow-x-auto py-2 px-4 scrollbar-none max-w-full">
          <div className="flex -space-x-8 sm:-space-x-10 items-end min-h-[120px] pb-1">
            {myHand.map((card, idx) => {
              const playable = isMyTurn && canPlayCard(card, gameState, currentSeat);

              return (
                <div
                  key={card.id || idx}
                  onClick={() => handleCardClick(card)}
                  style={{
                    zIndex: idx + 1,
                  }}
                  className={`transition-all duration-200 transform ${
                    playable
                      ? "-translate-y-4 hover:-translate-y-6 hover:scale-110 cursor-pointer drop-shadow-2xl"
                      : "translate-y-0 opacity-60 grayscale-[30%] cursor-not-allowed"
                  }`}
                >
                  <UnoCardView
                    card={card}
                    size="md"
                    isPlayable={playable}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Color Picker Modal for Wild Cards */}
      <UnoColorPicker
        isOpen={pendingWildCardId !== null}
        onSelectColor={handleColorSelect}
      />

      {/* 6. Challenge Decision Modal */}
      {isPendingChallengeForMe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161B26] border-2 border-amber-500 rounded-3xl p-5 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-base font-black text-amber-300 mb-1">Wild +4 Played Against You!</h3>
            <p className="text-xs text-slate-300 mb-4">
              Do you want to challenge? If the opponent had a matching color card in hand, they draw 4 instead! If they were innocent, you draw 6!
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => onDecideChallenge(true)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase shadow"
              >
                Challenge (+4)
              </button>
              <button
                onClick={() => onDecideChallenge(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase border border-slate-600"
              >
                Accept +4
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Exit / Close Match Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161B26] border border-slate-700 rounded-3xl p-5 max-w-xs w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Leave Match?</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isHost
                  ? "As host, you can close the match for everyone or leave."
                  : "Are you sure you want to exit to the lobby?"}
              </p>
            </div>

            <div className="space-y-2">
              {isHost && onCloseMatch && (
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    onCloseMatch();
                  }}
                  className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow transition-all active:scale-95"
                >
                  🛑 Close & Disband Room
                </button>
              )}

              {onLeaveMatch && (
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    onLeaveMatch();
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 active:scale-95"
                >
                  Leave Match
                </button>
              )}

              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-2 rounded-2xl text-slate-400 font-bold text-xs hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
