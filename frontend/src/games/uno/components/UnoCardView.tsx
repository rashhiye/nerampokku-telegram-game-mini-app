// ==============================================================================
// ORIGINAL UNO CARD SVG COMPONENT
// File: frontend/src/games/uno/components/UnoCardView.tsx
// ==============================================================================

import React from "react";
import { UnoCard, CardColor } from "../engine/types";

interface UnoCardViewProps {
  card?: UnoCard;
  faceDown?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const COLOR_CLASSES: Record<CardColor, { bg: string; border: string; text: string }> = {
  red: { bg: "bg-red-600", border: "border-red-400", text: "text-red-500" },
  blue: { bg: "bg-blue-600", border: "border-blue-400", text: "text-blue-500" },
  green: { bg: "bg-emerald-600", border: "border-emerald-400", text: "text-emerald-500" },
  yellow: { bg: "bg-amber-500", border: "border-amber-300", text: "text-amber-500" },
  wild: { bg: "bg-slate-900", border: "border-purple-400", text: "text-purple-400" },
};

export const UnoCardView: React.FC<UnoCardViewProps> = ({
  card,
  faceDown = false,
  isPlayable = false,
  isSelected = false,
  onClick,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-12 h-18 text-xs rounded-md",
    md: "w-20 h-28 text-base rounded-xl",
    lg: "w-28 h-40 text-xl rounded-2xl",
  }[size];

  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={`${sizeClasses} bg-[#121622] border-2 border-white/90 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-200 ${
          onClick ? "cursor-pointer active:scale-95 hover:scale-105 hover:border-amber-400" : ""
        }`}
      >
        {/* Iconic Tilted Red Oval on Back */}
        <div
          className="w-[85%] h-[60%] rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 border border-amber-300 shadow-md flex items-center justify-center -rotate-20"
        >
          <span className="font-black italic text-white text-xs sm:text-sm tracking-tighter drop-shadow">
            UNO
          </span>
        </div>
      </div>
    );
  }

  const colorInfo = COLOR_CLASSES[card.color];

  // Render Card Symbol or Value
  const renderSymbol = () => {
    switch (card.value) {
      case "skip":
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        );
      case "reverse":
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12v-3a3 3 0 0 1 3-3h13m0 0l-3-3m3 3l-3 3" />
            <path d="M20 12v3a3 3 0 0 1-3 3H4m0 0l3 3m-3-3l3-3" />
          </svg>
        );
      case "draw2":
        return <span className="font-black text-2xl tracking-tighter">+2</span>;
      case "wild":
        return (
          <div className="w-8 h-8 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border-2 border-white/80 shadow-md">
            <div className="bg-red-500" />
            <div className="bg-blue-500" />
            <div className="bg-amber-400" />
            <div className="bg-emerald-500" />
          </div>
        );
      case "wild4":
        return (
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border border-white/80">
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-amber-400" />
              <div className="bg-emerald-500" />
            </div>
            <span className="font-black text-xs text-white mt-0.5 tracking-tighter">+4</span>
          </div>
        );
      default:
        return <span className="font-black text-3xl">{card.value}</span>;
    }
  };

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`relative ${sizeClasses} select-none transition-all duration-200 shadow-xl overflow-hidden flex flex-col justify-between p-1.5 ${
        colorInfo.bg
      } border-2 ${
        isPlayable
          ? "cursor-pointer hover:-translate-y-3 hover:shadow-cyan-500/50 border-white ring-2 ring-white/60 animate-pulse-subtle"
          : isSelected
          ? "-translate-y-3 border-amber-300 ring-2 ring-amber-400"
          : "border-black/30 opacity-90"
      }`}
    >
      {/* Corner Value Top-Left */}
      <div className="font-black text-white text-xs leading-none drop-shadow">
        {card.value === "wild4" ? "+4" : card.value === "draw2" ? "+2" : card.value}
      </div>

      {/* Central Center Oval Graphic */}
      <div className="w-full flex-1 my-0.5 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-inner overflow-hidden relative">
        <div className={`w-full h-full flex items-center justify-center ${colorInfo.text}`}>
          {renderSymbol()}
        </div>
      </div>

      {/* Corner Value Bottom-Right (Rotated) */}
      <div className="font-black text-white text-xs leading-none self-end rotate-180 drop-shadow">
        {card.value === "wild4" ? "+4" : card.value === "draw2" ? "+2" : card.value}
      </div>
    </div>
  );
};
