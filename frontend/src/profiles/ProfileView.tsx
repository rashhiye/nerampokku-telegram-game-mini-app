// ==============================================================================
// PLAYER PROFILE & STATS VIEW
// File: frontend/src/profiles/ProfileView.tsx
// ==============================================================================

import React from "react";
import { Trophy, Flame, Target, Award, ArrowLeft } from "lucide-react";

interface ProfileStats {
  uno: { played: number; wins: number; losses: number; winRate: number };
  ludo: { played: number; wins: number; losses: number; winRate: number };
}

interface ProfileViewProps {
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
  stats: ProfileStats;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, stats, onBack }) => {
  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-5 select-none pb-20">
      {/* Top Bar with Back Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-xl font-black text-white">Player Profile</h2>
      </div>

      {/* User Header Card */}
      <div className="p-5 rounded-3xl bg-[#161B26] border border-slate-800 shadow-xl flex items-center space-x-4">
        <img
          src={
            user.photo_url ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120"
          }
          alt={user.first_name}
          className="w-16 h-16 rounded-3xl object-cover border-2 border-indigo-500 shadow-md"
        />
        <div>
          <h3 className="text-lg font-black text-white">
            {user.first_name} {user.last_name || ""}
          </h3>
          <p className="text-xs text-indigo-400 font-medium">
            {user.username ? `@${user.username}` : `ID: ${user.id}`}
          </p>
          <div className="flex items-center space-x-2 mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Verified Player
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid: UNO */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🃏</span>
            <h4 className="font-black text-sm text-white">UNO Statistics</h4>
          </div>
          <span className="text-xs font-bold text-amber-400 font-mono">
            {stats.uno.winRate}% Win Rate
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-[10px] font-bold text-slate-400">Played</div>
            <div className="text-base font-black text-white">{stats.uno.played}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
            <div className="text-[10px] font-bold text-emerald-400">Wins</div>
            <div className="text-base font-black text-emerald-300">{stats.uno.wins}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-rose-950/30 border border-rose-800/40">
            <div className="text-[10px] font-bold text-rose-400">Losses</div>
            <div className="text-base font-black text-rose-300">{stats.uno.losses}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid: LUDO */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎲</span>
            <h4 className="font-black text-sm text-white">LUDO Statistics</h4>
          </div>
          <span className="text-xs font-bold text-amber-400 font-mono">
            {stats.ludo.winRate}% Win Rate
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-[10px] font-bold text-slate-400">Played</div>
            <div className="text-base font-black text-white">{stats.ludo.played}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
            <div className="text-[10px] font-bold text-emerald-400">Wins</div>
            <div className="text-base font-black text-emerald-300">{stats.ludo.wins}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-rose-950/30 border border-rose-800/40">
            <div className="text-[10px] font-bold text-rose-400">Losses</div>
            <div className="text-base font-black text-rose-300">{stats.ludo.losses}</div>
          </div>
        </div>
      </div>

      {/* Achievements Showcase */}
      <div className="p-4 rounded-3xl bg-[#161B26] border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 mb-1">
          <Award className="w-4 h-4 text-amber-400" />
          <h4 className="font-black text-xs text-white uppercase tracking-wider">Achievements</h4>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="p-2 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-xl mb-1">⚡</div>
            <div className="font-bold text-white">Wild Master</div>
            <div className="text-slate-500">Won 5+ UNO matches</div>
          </div>
          <div className="p-2 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-xl mb-1">🎯</div>
            <div className="font-bold text-white">Ludo King</div>
            <div className="text-slate-500">Captured 10+ tokens</div>
          </div>
          <div className="p-2 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-xl mb-1">🔥</div>
            <div className="font-bold text-white">Speed Demon</div>
            <div className="text-slate-500">No timeout streak</div>
          </div>
        </div>
      </div>
    </div>
  );
};
