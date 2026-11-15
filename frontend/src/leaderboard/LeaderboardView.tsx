// ==============================================================================
// LEADERBOARD VIEW COMPONENT
// File: frontend/src/leaderboard/LeaderboardView.tsx
// ==============================================================================

import React, { useState } from "react";
import { Trophy, ArrowLeft, Medal } from "lucide-react";

export interface LeaderboardEntry {
  rank: number;
  profileId: string;
  name: string;
  username?: string;
  avatar?: string;
  wins: number;
  matchesPlayed: number;
  winRate: number;
}

interface LeaderboardViewProps {
  unoLeaderboard: LeaderboardEntry[];
  ludoLeaderboard: LeaderboardEntry[];
  onBack: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  unoLeaderboard,
  ludoLeaderboard,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"uno" | "ludo">("uno");

  const list = activeTab === "uno" ? unoLeaderboard : ludoLeaderboard;

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4 select-none pb-20">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-black text-white">Leaderboards</h2>
        </div>
      </div>

      {/* Game Selector Tabs */}
      <div className="flex p-1 bg-slate-900/80 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab("uno")}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "uno"
              ? "bg-rose-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>🃏</span>
          <span>UNO Ranking</span>
        </button>

        <button
          onClick={() => setActiveTab("ludo")}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "ludo"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>🎲</span>
          <span>LUDO Ranking</span>
        </button>
      </div>

      {/* Leaderboard Entries List */}
      <div className="space-y-2.5">
        {list.map((player) => {
          const isTop1 = player.rank === 1;
          const isTop2 = player.rank === 2;
          const isTop3 = player.rank === 3;

          const medalIcon = isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${player.rank}`;

          return (
            <div
              key={player.profileId}
              className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                isTop1
                  ? "bg-amber-950/40 border-2 border-amber-500/60 shadow-lg"
                  : isTop2
                  ? "bg-slate-800/80 border border-slate-600"
                  : isTop3
                  ? "bg-amber-950/20 border border-amber-900/40"
                  : "bg-[#161B26] border border-slate-800"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-8 text-center font-black text-sm text-amber-300 font-mono">
                  {medalIcon}
                </span>

                <img
                  src={
                    player.avatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60"
                  }
                  alt={player.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow"
                />

                <div>
                  <h4 className="font-extrabold text-xs text-white">{player.name}</h4>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {player.matchesPlayed} matches • {player.winRate}% win rate
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-amber-400 font-mono">{player.wins}</span>
                <div className="text-[9px] uppercase font-bold text-slate-500">Wins</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
