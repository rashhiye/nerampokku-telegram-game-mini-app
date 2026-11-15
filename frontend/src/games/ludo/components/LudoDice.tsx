// ==============================================================================
// LUDO ANIMATED 3D DICE COMPONENT
// File: frontend/src/games/ludo/components/LudoDice.tsx
// ==============================================================================

import React, { useState } from "react";
import { sounds } from "../../../telegram/audio";
import { haptics } from "../../../telegram/haptics";

interface LudoDiceProps {
  value: number | null;
  isRolling?: boolean;
  canRoll: boolean;
  onRoll: () => void;
}

export const LudoDice: React.FC<LudoDiceProps> = ({
  value,
  isRolling = false,
  canRoll,
  onRoll,
}) => {
  const [localRolling, setLocalRolling] = useState(false);

  const handleClick = () => {
    if (!canRoll || isRolling || localRolling) return;
    setLocalRolling(true);
    haptics.impact("heavy");
    sounds.rollDice();
    setTimeout(() => {
      setLocalRolling(false);
      onRoll();
    }, 450);
  };

  const rolling = isRolling || localRolling;
  const displayVal = value || 1;

  // Dot patterns for faces 1-6
  const renderDots = () => {
    switch (displayVal) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <span className="w-4 h-4 rounded-full bg-rose-600 shadow-sm" />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex justify-between p-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900" />
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 self-end" />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex justify-between p-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="w-3 h-3 rounded-full bg-slate-900 self-center" />
            <span className="w-3 h-3 rounded-full bg-slate-900 self-end" />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-2 gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="w-3 h-3 rounded-full bg-slate-900" />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span />
            <span className="w-3 h-3 rounded-full bg-slate-900 justify-self-end" />
            <span />
            <span className="w-3 h-3 rounded-full bg-slate-900 place-self-center" />
            <span />
            <span className="w-3 h-3 rounded-full bg-slate-900 self-end" />
            <span />
            <span className="w-3 h-3 rounded-full bg-slate-900 self-end justify-self-end" />
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 p-2 gap-1 place-items-center">
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="w-3 h-3 rounded-full bg-slate-900" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div
        onClick={handleClick}
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 shadow-xl border-2 border-slate-300 flex items-center justify-center relative cursor-pointer transition-all duration-200 ${
          rolling
            ? "animate-spin scale-110 shadow-indigo-500/50"
            : canRoll
            ? "ring-4 ring-indigo-500/70 hover:scale-105 active:scale-95 animate-pulse-subtle shadow-indigo-500/40"
            : "opacity-70 cursor-not-allowed"
        }`}
        style={{
          boxShadow: canRoll
            ? "0 10px 25px -5px rgba(99, 102, 241, 0.4), inset 0 -4px 0 rgba(0,0,0,0.15)"
            : "0 6px 12px -2px rgba(0,0,0,0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
        }}
      >
        {renderDots()}
      </div>
      <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
        {canRoll ? (rolling ? "Rolling..." : "Tap to Roll") : `Rolled: ${value || "-"}`}
      </span>
    </div>
  );
};
