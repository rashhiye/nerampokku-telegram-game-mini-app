// ==============================================================================
// MULTIPLAYER LOBBY MATCH BROWSER & MATCH CREATOR
// File: frontend/src/multiplayer/LobbyBrowser.tsx
// ==============================================================================

import React, { useState } from "react";
import { GameSessionInfo, GameType } from "./types";
import { Plus, Users, Play, Shield, Settings, Sparkles, RefreshCw } from "lucide-react";
import { haptics } from "../telegram/haptics";
import { Logo } from "../components/common/Logo";

interface LobbyBrowserProps {
  currentGroupId?: string;
  currentGroupTitle?: string;
  sessions: GameSessionInfo[];
  onJoinSession: (sessionId: string) => void;
  onCreateSession: (
    gameType: GameType,
    maxPlayers: number,
    rules: {
      turnTimer: number;
      allowStackingDraw2: boolean;
      allowStackingDraw4: boolean;
      wildChallengeEnabled: boolean;
      allowJumpIn: boolean;
      allowSevenZero: boolean;
      drawUntilPlayable: boolean;
    }
  ) => void;
  onRefresh?: () => void;
}

export const LobbyBrowser: React.FC<LobbyBrowserProps> = ({
  currentGroupTitle = "GameVerse Group",
  sessions,
  onJoinSession,
  onCreateSession,
  onRefresh,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType>("uno");
  const [playerCount, setPlayerCount] = useState<number>(4);

  // House Rules state
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [allowStackingDraw2, setAllowStackingDraw2] = useState(false);
  const [allowStackingDraw4, setAllowStackingDraw4] = useState(false);
  const [wildChallengeEnabled, setWildChallengeEnabled] = useState(true);
  const [allowJumpIn, setAllowJumpIn] = useState(false);
  const [allowSevenZero, setAllowSevenZero] = useState(false);
  const [drawUntilPlayable, setDrawUntilPlayable] = useState(false);

  const handleGameSelect = (game: GameType) => {
    setSelectedGame(game);
    setPlayerCount(4); // Default to 4
    haptics.selection();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.notification("success");
    onCreateSession(selectedGame, playerCount, {
      turnTimer,
      allowStackingDraw2,
      allowStackingDraw4,
      wildChallengeEnabled,
      allowJumpIn,
      allowSevenZero,
      drawUntilPlayable,
    });
    setIsCreateOpen(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-4 select-none pb-20">
      {/* Brand Header */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <Logo size="md" showTagline={true} />
        <span className="text-[11px] font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-800/60 font-malayalam">
          കളിക്കാം!
        </span>
      </div>

      {/* Group Context Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-indigo-950/80 border border-indigo-500/30 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Group Lobby</span>
          </div>
          <h2 className="text-lg font-black text-white">{currentGroupTitle}</h2>
          <p className="text-[11px] text-slate-400">Zero room codes — open to all group members!</p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white active:scale-95 transition-transform"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Action Header: Create Match Button */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-sm font-extrabold text-white flex items-center">
          <Users className="w-4 h-4 mr-1.5 text-indigo-400" />
          Active Matches ({sessions.length})
        </h3>
        <button
          onClick={() => {
            haptics.impact("medium");
            setIsCreateOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-lg flex items-center space-x-1.5 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Match</span>
        </button>
      </div>

      {/* Match Cards List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No active matches in this group</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Be the first to create an UNO or LUDO match!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-indigo-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow active:scale-95"
            >
              Create First Match
            </button>
          </div>
        ) : (
          sessions.map((session) => {
            const isUno = session.gameType === "uno";
            const isFull = session.currentPlayerCount >= session.maxPlayers;
            const isWaiting = session.status === "waiting";

            return (
              <div
                key={session.id}
                className="p-4 rounded-3xl bg-[#161B26] border border-slate-800/80 shadow-md flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md ${
                      isUno
                        ? "bg-gradient-to-br from-rose-500 to-amber-500"
                        : "bg-gradient-to-br from-blue-500 to-emerald-500"
                    }`}
                  >
                    {isUno ? "UNO" : "🎲"}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-white uppercase tracking-wide">
                        {isUno ? "UNO Match" : "LUDO Match"}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isWaiting
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isWaiting ? "WAITING" : session.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2 font-medium">
                      <span>Seats: <strong className="text-indigo-400">{session.currentPlayerCount}/{session.maxPlayers}</strong></span>
                      <span>•</span>
                      <span>Host: {session.hostName || "Member"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {isWaiting && !isFull ? (
                    <button
                      onClick={() => {
                        haptics.notification("success");
                        onJoinSession(session.id);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center space-x-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Join</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-slate-800 text-slate-500 font-bold text-xs px-4 py-2 rounded-2xl cursor-not-allowed border border-slate-700/50"
                    >
                      {isFull ? "Full" : "Started"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Match Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161B26] border-2 border-indigo-500/40 rounded-3xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-white text-center mb-1">Create Match</h2>
            <p className="text-xs text-slate-400 text-center mb-4">
              Configure game type, players and house rules:
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Game Selection */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Game
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleGameSelect("uno")}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${
                      selectedGame === "uno"
                        ? "bg-rose-950/40 border-rose-500 text-white ring-2 ring-rose-500/30"
                        : "bg-slate-800/60 border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="font-black text-base">🃏 UNO</div>
                    <span className="text-[10px] text-slate-400">3, 4, 5 or 6 Players</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGameSelect("ludo")}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${
                      selectedGame === "ludo"
                        ? "bg-blue-950/40 border-blue-500 text-white ring-2 ring-blue-500/30"
                        : "bg-slate-800/60 border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="font-black text-base">🎲 LUDO</div>
                    <span className="text-[10px] text-slate-400">4, 5 or 6 Players</span>
                  </button>
                </div>
              </div>

              {/* Player Count Selection */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Player Count
                </label>
                <div className="flex space-x-2">
                  {(selectedGame === "uno" ? [3, 4, 5, 6] : [4, 5, 6]).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setPlayerCount(count);
                        haptics.selection();
                      }}
                      className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${
                        playerCount === count
                          ? "bg-indigo-600 text-white shadow ring-2 ring-indigo-400/50"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {count}P
                    </button>
                  ))}
                </div>
              </div>

              {/* House Rules Toggles (UNO Specific) */}
              {selectedGame === "uno" && (
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl space-y-2.5">
                  <div className="flex items-center text-xs font-bold text-indigo-400 mb-1">
                    <Settings className="w-3.5 h-3.5 mr-1" /> UNO House Rules
                  </div>

                  <label className="flex items-center justify-between text-xs text-slate-300">
                    <span>Wild +4 Challenge</span>
                    <input
                      type="checkbox"
                      checked={wildChallengeEnabled}
                      onChange={(e) => setWildChallengeEnabled(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300">
                    <span>+2 Stacking</span>
                    <input
                      type="checkbox"
                      checked={allowStackingDraw2}
                      onChange={(e) => setAllowStackingDraw2(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300">
                    <span>+4 Stacking</span>
                    <input
                      type="checkbox"
                      checked={allowStackingDraw4}
                      onChange={(e) => setAllowStackingDraw4(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300">
                    <span>Jump-In (exact match)</span>
                    <input
                      type="checkbox"
                      checked={allowJumpIn}
                      onChange={(e) => setAllowJumpIn(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded"
                    />
                  </label>
                </div>
              )}

              {/* Turn Timer Selector */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Turn Timer
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTurnTimer(t)}
                      className={`py-1.5 rounded-xl font-bold text-xs ${
                        turnTimer === t
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-2xl text-xs border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-2xl text-xs shadow-lg active:scale-95"
                >
                  Create Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
