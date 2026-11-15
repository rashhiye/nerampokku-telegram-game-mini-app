// ==============================================================================
// LUDO REALISTIC 3D ANIMATED ROLLING DICE COMPONENT
// File: frontend/src/games/ludo/components/LudoDice.tsx
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
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
  const [internalRolling, setInternalRolling] = useState(false);
  const [animatedFace, setAnimatedFace] = useState<number>(value || 1);
  const rollIntervalRef = useRef<any>(null);

  const activeRolling = isRolling || internalRolling;

  // Trigger tumbling face changes when rolling
  useEffect(() => {
    if (activeRolling) {
      sounds.rollDice();
      haptics.impact("heavy");

      // Rapidly tumble dice faces (every 60ms)
      rollIntervalRef.current = setInterval(() => {
        setAnimatedFace(Math.floor(Math.random() * 6) + 1);
      }, 60);
    } else {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }
      setAnimatedFace(value || 1);
    }

    return () => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
      }
    };
  }, [activeRolling, value]);

  const handleDiceClick = () => {
    if (!canRoll || activeRolling) return;

    setInternalRolling(true);

    // Roll for 650ms, then trigger authoritative onRoll
    setTimeout(() => {
      setInternalRolling(false);
      onRoll();
      haptics.impact("medium");
    }, 650);
  };

  const displayVal = activeRolling ? animatedFace : (value || 1);

  // Render high-contrast traditional dice dots
  const renderDots = () => {
    switch (displayVal) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-600 shadow-md ring-1 ring-rose-400" />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex justify-between p-2 sm:p-2.5">
            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900 shadow-sm" />
            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900 shadow-sm self-end" />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex justify-between p-2">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm" />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm self-center" />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm self-end" />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-2 sm:p-2.5 gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 shadow-sm place-self-center" />
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 shadow-sm place-self-center" />
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 shadow-sm place-self-center" />
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 shadow-sm place-self-center" />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-1.5 sm:p-2">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm" />
            <span />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm justify-self-end" />
            <span />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm place-self-center" />
            <span />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm self-end" />
            <span />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm self-end justify-self-end" />
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 p-2 gap-1.5 place-items-center">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm" />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm" />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm" />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm" />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm" />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 shadow-sm" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div
        onClick={handleDiceClick}
        className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 flex items-center justify-center relative cursor-pointer select-none transition-all duration-150 ${
          activeRolling
            ? "rotate-180 scale-110 border-amber-400 ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.8)] animate-pulse"
            : canRoll
            ? "border-emerald-400 ring-4 ring-emerald-400/80 hover:scale-105 active:scale-95 shadow-xl animate-bounce"
            : "border-slate-400/60 opacity-80 cursor-not-allowed shadow-md"
        }`}
        style={{
          boxShadow: canRoll
            ? "0 12px 25px -4px rgba(16, 185, 129, 0.4), inset 0 -4px 0 rgba(0,0,0,0.15)"
            : "0 6px 15px -2px rgba(0,0,0,0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
        }}
      >
        {renderDots()}
      </div>

      <span
        className={`text-[11px] font-black mt-1 uppercase tracking-wider ${
          activeRolling
            ? "text-amber-400 animate-pulse"
            : canRoll
            ? "text-emerald-400 animate-pulse font-extrabold"
            : "text-slate-400"
        }`}
      >
        {activeRolling ? "Rolling..." : canRoll ? "TAP TO ROLL!" : `Rolled: ${value || "-"}`}
      </span>
    </div>
  );
};
