// ==============================================================================
// LUDO TABLE CONTAINER COMPONENT (4P & 6P)
// File: frontend/src/games/ludo/components/LudoTable.tsx
// ==============================================================================

import React from "react";
import { LudoGameState } from "../engine/types";
import { Board4P } from "./Board4P";
import { Board5P } from "./Board5P";
import { Board6P } from "./Board6P";
import { LudoDice } from "./LudoDice";
import { Trophy } from "lucide-react";
import { sounds } from "../../../telegram/audio";
import confetti from "canvas-confetti";

interface LudoPlayerInfo {
  seat: number;
  name: string;
  avatar?: string;
  isCurrentUser: boolean;
}

interface LudoTableProps {
  gameState: LudoGameState;
  currentSeat: number;
  players: LudoPlayerInfo[];
  onRollDice: () => void;
  onMoveToken: (tokenId: string) => void;
  onPassTurn: () => void;
  onRematch?: () => void;
}

export const LudoTable: React.FC<LudoTableProps> = ({
  gameState,
  currentSeat,
  players,
  onRollDice,
  onMoveToken,
  onPassTurn,
  onRematch,
}) => {
  const isMyTurn = gameState.currentTurnSeat === currentSeat;
  const canRoll = isMyTurn && gameState.turnPhase === "ROLL";
  const activePlayerInfo = players.find((p) => p.seat === gameState.currentTurnSeat);

  // Trigger confetti when game ends
  React.useEffect(() => {
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
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#0A0D14] select-none p-2 sm:p-4">
      {/* 1. Header Bar: Player Turn Status & Consecutive Sixes indicator */}
      <div className="flex items-center justify-between z-10 py-1.5 px-3 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-300">
            {gameState.playerCount}-Player Ludo
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {gameState.consecutiveSixes > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
              Six Streak: {gameState.consecutiveSixes}/3
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
            Turn: <strong className="text-white">{activePlayerInfo?.name || `Seat ${gameState.currentTurnSeat}`}</strong>
          </span>
        </div>
      </div>

      {/* 2. Responsive Game Board */}
      <div className="flex-1 flex items-center justify-center relative my-1">
        {gameState.playerCount === 6 ? (
          <Board6P gameState={gameState} onTokenClick={onMoveToken} />
        ) : gameState.playerCount === 5 ? (
          <Board5P gameState={gameState} onTokenClick={onMoveToken} />
        ) : (
          <Board4P gameState={gameState} onTokenClick={onMoveToken} />
        )}
      </div>

      {/* 3. Controls Tray & 3D Animated Dice */}
      <div className="z-20 w-full flex items-center justify-between max-w-sm mx-auto px-4 py-2 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl">
        {/* Current User Status */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <img
              src={
                players.find((p) => p.seat === currentSeat)?.avatar ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60"
              }
              alt="You"
              className="w-11 h-11 rounded-full border-2 border-indigo-400 object-cover shadow"
            />
            <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-[10px] font-black text-white px-1.5 py-0.2 rounded-full border border-slate-900">
              YOU
            </span>
          </div>
          <div>
            <div className="text-xs font-black text-white">Seat {currentSeat}</div>
            <div className="text-[11px] text-slate-400 font-medium">
              Finished: {gameState.players[currentSeat]?.finishedCount || 0}/4
            </div>
          </div>
        </div>

        {/* 3D Dice Component */}
        <LudoDice
          value={gameState.currentDiceValue}
          canRoll={canRoll}
          onRoll={onRollDice}
        />
      </div>

      {/* 4. Victory / Game Over Podium Modal */}
      {gameState.turnPhase === "GAME_OVER" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161B26] border-2 border-amber-500/60 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl font-black text-white mb-2">MATCH FINISHED!</h2>

            <div className="space-y-2 my-4 text-left">
              {gameState.winnerRanking.map((seat, index) => {
                const p = players.find((pl) => pl.seat === seat);
                const medals = ["🥇 1st Place", "🥈 2nd Place", "🥉 3rd Place", "🎖️ 4th Place"];
                return (
                  <div
                    key={seat}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60"
                  >
                    <span className="text-xs font-bold text-amber-300">{medals[index]}</span>
                    <span className="text-xs font-extrabold text-white">{p?.name || `Seat ${seat}`}</span>
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
    </div>
  );
};
