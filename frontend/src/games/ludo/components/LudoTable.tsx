// ==============================================================================
// LUDO TABLE CONTAINER COMPONENT (4P & 6P - POLISHED REFERENCE DESIGN)
// File: frontend/src/games/ludo/components/LudoTable.tsx
// ==============================================================================

import React, { useState, useEffect } from "react";
import { LudoGameState } from "../engine/types";
import { Board4P } from "./Board4P";
import { Board5P } from "./Board5P";
import { Board6P } from "./Board6P";
import { LudoDice } from "./LudoDice";
import { Trophy, LogOut, ShieldAlert } from "lucide-react";
import { sounds } from "../../../telegram/audio";
import { getPlayerAvatar } from "../../../utils/avatar";
import confetti from "canvas-confetti";

export interface LudoPlayerInfo {
  seat: number;
  name: string;
  avatar?: string;
  isCurrentUser: boolean;
}

interface LudoTableProps {
  gameState: LudoGameState;
  currentSeat: number;
  players: LudoPlayerInfo[];
  speechBubbles?: Record<number, { text: string; expiresAt: number }>;
  isHost?: boolean;
  onRollDice: () => void;
  onMoveToken: (tokenId: string) => void;
  onPassTurn: () => void;
  onRematch?: () => void;
  onLeaveMatch?: () => void;
  onCloseMatch?: () => void;
}

export const LudoTable: React.FC<LudoTableProps> = ({
  gameState,
  currentSeat,
  players,
  speechBubbles = {},
  isHost = false,
  onRollDice,
  onMoveToken,
  onPassTurn,
  onRematch,
  onLeaveMatch,
  onCloseMatch,
}) => {
  const [showExitModal, setShowExitModal] = useState(false);

  const isMyTurn = gameState.currentTurnSeat === currentSeat;
  const canRoll = isMyTurn && gameState.turnPhase === "ROLL";
  const canMove = isMyTurn && gameState.turnPhase === "MOVE";
  const activePlayerInfo = players.find((p) => p.seat === gameState.currentTurnSeat);
  const activePlayerName = activePlayerInfo?.name || `Seat ${gameState.currentTurnSeat + 1}`;
  const currentUser = players.find((p) => p.seat === currentSeat);

  // Trigger confetti when game ends
  useEffect(() => {
    if (gameState.turnPhase === "GAME_OVER") {
      sounds.victory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [gameState.turnPhase]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#0A0D14] select-none p-2 sm:p-4 text-slate-100 font-['Outfit',sans-serif]">
      {/* 1. Header Bar: Player Turn Status, Six Streak & Exit Button */}
      <div className="flex items-center justify-between z-20 py-1.5 px-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black text-slate-200">
            {gameState.playerCount}P Ludo
          </span>
          {gameState.consecutiveSixes > 0 && (
            <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600 animate-pulse">
              Six: {gameState.consecutiveSixes}/3
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow transition-all ${
              isMyTurn
                ? "bg-emerald-500 text-slate-950 border-white ring-2 ring-emerald-300 animate-pulse"
                : "bg-slate-800 border-slate-700 text-slate-300"
            }`}
          >
            {isMyTurn
              ? canRoll
                ? "🎲 YOUR TURN: ROLL DICE!"
                : "♟️ YOUR TURN: MOVE TOKEN!"
              : `⏳ ${activePlayerName}'s Turn`}
          </span>

          {/* Exit Match Button */}
          <button
            onClick={() => setShowExitModal(true)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-transform"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Opponents Orbit & Speech Bubbles Bar */}
      <div className="flex items-center justify-around w-full py-1 z-10 px-2">
        {players.map((p) => {
          const isTurn = gameState.currentTurnSeat === p.seat;
          const finished = gameState.players[p.seat]?.finishedCount || 0;

          return (
            <div
              key={p.seat}
              className={`relative flex flex-col items-center p-1.5 rounded-2xl transition-all duration-300 ${
                isTurn
                  ? "bg-indigo-950/90 ring-2 ring-amber-400 scale-105 shadow-xl"
                  : "bg-slate-900/60"
              }`}
            >
              {/* Speech Bubble */}
              {speechBubbles[p.seat] && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-2xl shadow-2xl border border-slate-300 whitespace-nowrap animate-bounce z-30 pointer-events-none">
                  {speechBubbles[p.seat].text}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                </div>
              )}

              <div className="relative">
                <img
                  src={getPlayerAvatar(p.avatar, p.name, p.seat.toString())}
                  alt={p.name}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 object-cover shadow ${
                    isTurn ? "border-amber-400 ring-2 ring-amber-400 animate-pulse" : "border-slate-700"
                  }`}
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-950 shadow">
                  {finished}/4
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-300 mt-0.5 max-w-[65px] truncate">
                {p.isCurrentUser ? "You" : p.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Responsive SVG Game Board (4P, 5P, 6P) */}
      <div className="flex-1 flex items-center justify-center relative my-1">
        {gameState.playerCount === 6 ? (
          <Board6P gameState={gameState} onTokenClick={onMoveToken} />
        ) : gameState.playerCount === 5 ? (
          <Board5P gameState={gameState} onTokenClick={onMoveToken} />
        ) : (
          <Board4P gameState={gameState} onTokenClick={onMoveToken} />
        )}
      </div>

      {/* 4. Controls Tray & 3D Animated Dice */}
      <div className="z-20 w-full flex items-center justify-between max-w-sm mx-auto px-4 py-2.5 bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl">
        {/* Current User Status */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <img
              src={getPlayerAvatar(currentUser?.avatar, currentUser?.name, currentSeat.toString())}
              alt="You"
              className={`w-11 h-11 rounded-full border-2 object-cover shadow ${
                isMyTurn ? "border-amber-400 ring-2 ring-amber-400 animate-pulse" : "border-slate-600"
              }`}
            />
            <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-[9px] font-black text-white px-1.5 py-0.2 rounded-full border border-slate-900 shadow">
              YOU
            </span>
          </div>
          <div>
            <div className="text-xs font-black text-white">{currentUser?.name || "You"}</div>
            <div className="text-[10px] text-amber-400 font-bold">
              Finished: {gameState.players[currentSeat]?.finishedCount || 0}/4 tokens
            </div>
          </div>
        </div>

        {/* 3D Dice Component */}
        <div className="flex items-center space-x-2">
          {canRoll && (
            <span className="text-[10px] font-black text-amber-300 uppercase animate-bounce mr-1 hidden sm:inline">
              Tap Dice!
            </span>
          )}
          <LudoDice
            value={gameState.currentDiceValue}
            canRoll={canRoll}
            onRoll={onRollDice}
          />
        </div>
      </div>

      {/* 5. Victory / Game Over Podium Modal */}
      {gameState.turnPhase === "GAME_OVER" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161B26] border-2 border-amber-500/60 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl font-black text-white mb-2">MATCH FINISHED!</h2>

            <div className="space-y-2 my-4 text-left">
              {gameState.winnerRanking.map((seat, index) => {
                const p = players.find((pl) => pl.seat === seat);
                const medals = ["🥇 1st Place", "🥈 2nd Place", "🥉 3rd Place", "🎖️ 4th Place", "5th", "6th"];
                return (
                  <div
                    key={seat}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60"
                  >
                    <span className="text-xs font-bold text-amber-300">{medals[index]}</span>
                    <span className="text-xs font-extrabold text-white">{p?.name || `Seat ${seat + 1}`}</span>
                  </div>
                );
              })}
            </div>

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

      {/* 6. Exit / Close Match Confirmation Modal */}
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
