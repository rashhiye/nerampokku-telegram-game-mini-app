// ==============================================================================
// MULTIPLAYER MATCH WAITING ROOM
// File: frontend/src/multiplayer/WaitingRoom.tsx
// ==============================================================================

import React, { useState } from "react";
import { GameSessionInfo, SessionPlayerInfo } from "./types";
import { Crown, User, Share2, LogOut, Play, Copy, Check, UserPlus } from "lucide-react";
import { haptics } from "../telegram/haptics";
import { getPlayerAvatar } from "../utils/avatar";

interface WaitingRoomProps {
  session: GameSessionInfo;
  players: SessionPlayerInfo[];
  currentUserId: string;
  isHost: boolean;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onAddBot?: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  session,
  players,
  currentUserId,
  isHost,
  onStartMatch,
  onLeaveRoom,
  onAddBot,
}) => {
  const [copied, setCopied] = useState(false);

  const canStart = players.length >= session.minPlayers;
  const isUno = session.gameType === "uno";

  const handleCopyLink = () => {
    const botUser = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "nerampokk_gamebot";
    const shareUrl = `https://t.me/${botUser}/nerampokku?startapp=s_${session.id}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    haptics.notification("success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTelegramShare = () => {
    const botUser = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "nerampokk_gamebot";
    const shareUrl = `https://t.me/${botUser}/nerampokku?startapp=s_${session.id}`;
    const text = `🎮 Join me on നേരംപോക്ക് to play ${isUno ? "UNO" : "LUDO"}! Seats: ${players.length}/${session.maxPlayers} — Tap to play!`;
    const tgShareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(tgShareLink, "_blank");
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-5 select-none pb-20">
      {/* Header */}
      <div className="text-center">
        <div className="inline-block p-3 rounded-3xl bg-indigo-950/60 border border-indigo-500/30 shadow-lg mb-2">
          <span className="text-3xl">{isUno ? "🃏" : "🎲"}</span>
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-wide">
          {isUno ? "UNO Waiting Room" : "LUDO Waiting Room"}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Players joined: <strong className="text-indigo-400">{players.length}/{session.maxPlayers}</strong> (Need {session.minPlayers} to start)
        </p>
      </div>

      {/* Seat Slots Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: session.maxPlayers }).map((_, seatIdx) => {
          const seatedPlayer = players.find((p) => p.seatIndex === seatIdx);
          const isMe = seatedPlayer?.profileId === currentUserId;

          if (seatedPlayer) {
            return (
              <div
                key={seatIdx}
                className={`p-3.5 rounded-3xl border-2 flex items-center space-x-3 transition-all ${
                  isMe
                    ? "bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30"
                    : "bg-[#161B26] border-slate-800"
                }`}
              >
                <div className="relative">
                  <img
                    src={getPlayerAvatar(seatedPlayer.avatar, seatedPlayer.name, seatedPlayer.profileId)}
                    alt={seatedPlayer.name}
                    className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shadow bg-slate-800"
                  />
                  {seatedPlayer.isHost && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 p-1 rounded-full shadow">
                      <Crown className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="overflow-hidden">
                  <div className="font-extrabold text-xs text-white truncate">
                    {seatedPlayer.name} {isMe && "(You)"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Seat #{seatIdx + 1}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={seatIdx}
              className="p-3.5 rounded-3xl border-2 border-dashed border-slate-800/80 bg-slate-900/30 flex items-center space-x-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-600">
                <User className="w-5 h-5 opacity-40" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-600">Open Seat</span>
                <div className="text-[10px] text-slate-700 font-mono">Slot #{seatIdx + 1}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share / Invite Section */}
      <div className="p-3.5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold text-white">Invite Group Friends</span>
          <p className="text-[10px] text-slate-400">Share match link directly into Telegram</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleCopyLink}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-transform"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleTelegramShare}
            className="px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center space-x-1 shadow active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Optional: Host can add a bot player for testing */}
      {isHost && players.length < session.maxPlayers && onAddBot && (
        <button
          type="button"
          onClick={onAddBot}
          className="w-full py-2.5 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-700/40 text-indigo-300 font-bold text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
          <span>+ Add Bot Player (Optional Solo Test)</span>
        </button>
      )}

      {/* Start / Leave Action Buttons */}
      <div className="space-y-2 pt-2">
        {isHost ? (
          <button
            onClick={onStartMatch}
            disabled={!canStart}
            className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center space-x-2 transition-transform active:scale-95 ${
              canStart
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500"
                : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{canStart ? "Start Match Now" : `Waiting for ${session.minPlayers - players.length} more...`}</span>
          </button>
        ) : (
          <div className="text-center py-2 text-xs font-bold text-slate-400 animate-pulse">
            Waiting for host to start match...
          </div>
        )}

        <button
          onClick={onLeaveRoom}
          className="w-full py-2.5 rounded-2xl font-bold text-xs text-rose-400 hover:bg-rose-950/20 border border-rose-900/50 flex items-center justify-center space-x-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Room</span>
        </button>
      </div>
    </div>
  );
};
