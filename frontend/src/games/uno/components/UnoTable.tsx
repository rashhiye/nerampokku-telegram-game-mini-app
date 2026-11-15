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
import { RotateCw, RotateCcw, AlertTriangle, LogOut, ShieldAlert } from "lucide-react";
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
  turnSecondsLeft?: number;
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
  turnSecondsLeft = 15,
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

  // Call UNO button
  const handleCallUnoClick = () => {
    haptics.impact("heavy");
    sounds.playCard();
    onCallUno();
  };

  // Victory Confetti
  useEffect(() => {
    if (gameState.winnerSeat !== null && gameState.winnerSeat !== undefined) {
      sounds.victory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [gameState.winnerSeat]);

  // Seat positioning relative to current user
  const otherPlayers = players.filter((p) => p.seat !== currentSeat);
  const topOpponent = otherPlayers[0] || null;
  const leftOpponent = otherPlayers[1] || null;
  const rightOpponent = otherPlayers[2] || null;
  const currentUserInfo = players.find((p) => p.seat === currentSeat);

  const shouldPromptUno = myHand.length === 2 && isMyTurn && !gameState.unoDeclared[currentSeat];

  // Dynamic margin for card fan
  const getCardMargin = () => {
    if (myHand.length <= 4) return "first:ml-0 mx-1 sm:mx-1.5";
    if (myHand.length <= 6) return "first:ml-0 -ml-2.5 sm:-ml-3";
    if (myHand.length <= 8) return "first:ml-0 -ml-4 sm:-ml-5";
    if (myHand.length <= 11) return "first:ml-0 -ml-5 sm:-ml-6";
    return "first:ml-0 -ml-6 sm:-ml-7";
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-screen flex flex-col justify-between overflow-hidden bg-[#38166D] select-none text-slate-100 font-['Outfit',sans-serif]">
      {/* Geometric Scatter Pattern Background (Matching Reference Image 1) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="uno-scatter" width="60" height="60" patternUnits="userSpaceOnUse">
              <polygon points="10,15 25,45 40,15" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
              <polygon points="35,10 50,40 20,40" fill="none" stroke="#FFFFFF" strokeWidth="1.5" transform="rotate(45 35 25)" />
              <circle cx="15" cy="45" r="4" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
              <rect x="42" y="38" width="8" height="8" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#uno-scatter)" />
        </svg>
      </div>

      {/* 1. TOP HEADER BAR: Direction, Turn Timer Countdown & Exit */}
      <div className="relative z-20 flex items-center justify-between px-3 py-2 bg-[#250B4B]/90 backdrop-blur-md border-b border-purple-500/30 shadow-md">
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
            <span className="text-xs font-black text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded-full border border-amber-500 animate-pulse">
              +{gameState.drawStackCount} Penalty!
            </span>
          )}
        </div>

        {/* Turn Status Banner & Active Countdown Timer */}
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

          {/* Turn Countdown Display */}
          <div
            className={`text-xs font-black px-3.5 py-1 rounded-full border shadow flex items-center space-x-1.5 transition-all ${
              turnSecondsLeft <= 5
                ? "bg-rose-600 text-white border-white animate-pulse ring-2 ring-rose-400"
                : isMyTurn
                ? "bg-emerald-500 text-slate-950 border-white ring-2 ring-emerald-300 animate-pulse"
                : "bg-purple-950/80 border-purple-400/40 text-purple-200"
            }`}
          >
            <span className="font-mono text-sm font-black">{turnSecondsLeft}s</span>
            <span>{isMyTurn ? "• YOUR TURN!" : `• ${activePlayerName}`}</span>
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
        <div className="relative z-10 flex flex-col items-center pt-2">
          {/* Speech Bubble */}
          {speechBubbles[topOpponent.seat] && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-slate-950 font-black text-xs px-3 py-1 rounded-2xl shadow-2xl border border-slate-300 whitespace-nowrap animate-bounce z-30 pointer-events-none">
              {speechBubbles[topOpponent.seat].text}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
            </div>
          )}

          {/* Mini Card Fan */}
          <div className="flex -space-x-2.5 mb-1.5">
            {Array.from({ length: Math.min(gameState.playerHands[topOpponent.seat]?.length || 0, 7) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-7 rounded bg-[#0F1422] border border-white/90 shadow flex items-center justify-center overflow-hidden"
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
                className={`w-10 h-10 rounded-full object-cover border-2 shadow-xl transition-all ${
                  gameState.currentTurnSeat === topOpponent.seat
                    ? "border-amber-400 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#38166D] animate-pulse scale-110"
                    : "border-purple-400/60"
                }`}
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow">
                {gameState.playerHands[topOpponent.seat]?.length || 0}
              </span>
            </div>
            <span className="text-xs font-black text-white drop-shadow max-w-[90px] truncate">
              {topOpponent.name}
            </span>
          </div>
        </div>
      )}

      {/* 3. MIDDLE PLAY ZONE: Left Opponent, Center Circular Ring, Right Opponent */}
      <div className="relative z-10 flex-1 flex items-center justify-between px-3 sm:px-6 my-auto">
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

              {/* Vertical Card Stack */}
              <div className="flex flex-col -space-y-3.5 mb-1.5">
                {Array.from({ length: Math.min(gameState.playerHands[leftOpponent.seat]?.length || 0, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-4.5 rounded bg-[#0F1422] border border-white/90 shadow flex items-center justify-center"
                  >
                    <div className="w-5 h-3 rounded-full bg-red-600 rotate-12" />
                  </div>
                ))}
              </div>

              <div className="relative">
                <img
                  src={getPlayerAvatar(leftOpponent.avatar, leftOpponent.name, leftOpponent.seat.toString())}
                  alt={leftOpponent.name}
                  className={`w-10 h-10 rounded-full object-cover border-2 shadow-xl transition-all ${
                    gameState.currentTurnSeat === leftOpponent.seat
                      ? "border-amber-400 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#38166D] animate-pulse scale-110"
                      : "border-purple-400/60"
                  }`}
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow">
                  {gameState.playerHands[leftOpponent.seat]?.length || 0}
                </span>
              </div>
              <span className="text-[11px] font-black text-white drop-shadow mt-1 text-center truncate max-w-[75px]">
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
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.35)] flex items-center justify-center bg-purple-950/40">
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

            <div className="flex items-center space-x-3 sm:space-x-4 z-10">
              {/* Draw Pile (Tilted Face Down) */}
              <div
                onClick={handleDrawClick}
                className={`relative cursor-pointer transition-transform active:scale-90 ${
                  isMyTurn ? "hover:scale-105" : "opacity-90"
                }`}
              >
                {/* 3D Stack Effect */}
                <div className="absolute top-1 left-1 w-14 h-22 sm:w-16 sm:h-26 rounded-xl bg-slate-900 border border-slate-700 -rotate-6 shadow-md" />
                <div className="absolute top-0.5 left-0.5 w-14 h-22 sm:w-16 sm:h-26 rounded-xl bg-indigo-950 border border-indigo-800 rotate-3 shadow-md" />
                <UnoCardView faceDown size="md" />
                {isMyTurn && (
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-300 uppercase whitespace-nowrap drop-shadow bg-slate-950/90 px-2 py-0.5 rounded-full border border-amber-400">
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
            className={`absolute -bottom-2 -right-1 sm:right-1 z-20 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-red-600 font-black text-xs sm:text-sm tracking-tighter uppercase shadow-2xl border-2 border-white transition-transform active:scale-90 ${
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

              {/* Vertical Card Stack */}
              <div className="flex flex-col -space-y-3.5 mb-1.5">
                {Array.from({ length: Math.min(gameState.playerHands[rightOpponent.seat]?.length || 0, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-4.5 rounded bg-[#0F1422] border border-white/90 shadow flex items-center justify-center"
                  >
                    <div className="w-5 h-3 rounded-full bg-red-600 -rotate-12" />
                  </div>
                ))}
              </div>

              <div className="relative">
                <img
                  src={getPlayerAvatar(rightOpponent.avatar, rightOpponent.name, rightOpponent.seat.toString())}
                  alt={rightOpponent.name}
                  className={`w-10 h-10 rounded-full object-cover border-2 shadow-xl transition-all ${
                    gameState.currentTurnSeat === rightOpponent.seat
                      ? "border-amber-400 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#38166D] animate-pulse scale-110"
                      : "border-purple-400/60"
                  }`}
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow">
                  {gameState.playerHands[rightOpponent.seat]?.length || 0}
                </span>
              </div>
              <span className="text-[11px] font-black text-white drop-shadow mt-1 text-center truncate max-w-[75px]">
                {rightOpponent.name}
              </span>
            </div>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* 4. CURRENT USER BOTTOM HAND & CURVED BLUE TRAY (Matching Reference Image 1) */}
      <div className="relative z-20 w-full pt-3 pb-3 px-3 bg-gradient-to-b from-[#008AE6] to-[#006BB3] rounded-t-[32px] border-t-4 border-[#38B6FF] shadow-2xl flex flex-col">
        {/* User Avatar & Info Row (Left aligned like in Reference Image 1) */}
        <div className="flex items-center justify-between px-2 mb-1.5">
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
                  isMyTurn ? "border-amber-400 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#008AE6] animate-pulse" : "border-white"
                }`}
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow">
                {myHand.length}
              </span>
            </div>
            <div>
              <span className="text-xs font-black text-white drop-shadow-sm">
                {currentUserInfo?.name || "You"} (You)
              </span>
              <div className="text-[10px] font-bold text-amber-200">
                {myHand.length} {myHand.length === 1 ? "Card Left!" : "Cards"}
              </div>
            </div>
          </div>

          {/* Quick UNO Call Button if available */}
          {shouldPromptUno && (
            <button
              onClick={handleCallUnoClick}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-xl animate-pulse border-2 border-white"
            >
              ⚠️ CALL UNO!
            </button>
          )}
        </div>

        {/* Fanned Cards Strip (High contrast, 100% opaque, generous spacing) */}
        <div className="w-full overflow-x-auto py-2 px-1 scrollbar-none flex justify-center">
          <div className="flex items-end min-h-[125px] sm:min-h-[135px] pb-1 px-4">
            {myHand.map((card, idx) => {
              const playable = isMyTurn && canPlayCard(card, gameState, currentSeat);
              const total = myHand.length;
              const mid = (total - 1) / 2;
              const rot = total > 1 ? (idx - mid) * (total > 7 ? 2 : 3) : 0;

              return (
                <div
                  key={card.id || idx}
                  onClick={() => handleCardClick(card)}
                  style={{
                    zIndex: idx + 1,
                    transform: `rotate(${rot}deg) translateY(${playable ? "-20px" : "0px"})`,
                  }}
                  className={`transition-all duration-200 ${getCardMargin()} ${
                    playable
                      ? "hover:-translate-y-7 hover:scale-110 cursor-pointer drop-shadow-2xl"
                      : "opacity-100 brightness-90 cursor-not-allowed hover:brightness-100"
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
              <h3 className="text-base font-black text-white">Leave or Close Match?</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isHost
                  ? "As host, you can leave the match or completely close the room for everyone."
                  : "Are you sure you want to leave this game? Your seat will be forfeited."}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {isHost && onCloseMatch && (
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    onCloseMatch();
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase shadow tracking-wider"
                >
                  Close & Disband Room
                </button>
              )}

              {onLeaveMatch && (
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    onLeaveMatch();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase border border-slate-700"
                >
                  Leave Match
                </button>
              )}

              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Match Winner Game Over Modal */}
      {gameState.winnerSeat !== null && gameState.winnerSeat !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161B26] border-2 border-amber-500/80 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-3">
            <div className="text-4xl animate-bounce">🏆</div>
            <h2 className="text-xl font-black text-white">UNO CHAMPION!</h2>
            <div className="text-base font-bold text-amber-400">
              {players.find((p) => p.seat === gameState.winnerSeat)?.name || `Seat ${gameState.winnerSeat + 1}`} Won!
            </div>
            <p className="text-xs text-slate-400">
              {gameState.winnerSeat === currentSeat
                ? "Congratulations! You emptied your hand first!"
                : "Good game! Better luck next round!"}
            </p>

            {onRematch && isHost && (
              <button
                onClick={onRematch}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-2xl shadow-lg mt-2 text-xs uppercase tracking-wider"
              >
                Play Again
              </button>
            )}

            {onLeaveMatch && (
              <button
                onClick={onLeaveMatch}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-2xl border border-slate-700 text-xs uppercase"
              >
                Back to Lobby
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
