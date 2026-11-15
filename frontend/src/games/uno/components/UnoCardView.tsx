// ==============================================================================
// AUTHENTIC UNO CARD SVG & CSS COMPONENT (100% OPAQUE & HIGH CONTRAST)
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

const COLOR_MAP: Record<CardColor, { bg: string; text: string; hex: string }> = {
  red: { bg: "bg-[#E51B24]", text: "text-[#E51B24]", hex: "#E51B24" },
  blue: { bg: "bg-[#0072CE]", text: "text-[#0072CE]", hex: "#0072CE" },
  green: { bg: "bg-[#00A859]", text: "text-[#00A859]", hex: "#00A859" },
  yellow: { bg: "bg-[#FFC20E]", text: "text-[#D99A00]", hex: "#FFC20E" },
  wild: { bg: "bg-[#1E1B2E]", text: "text-purple-400", hex: "#1E1B2E" },
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
    sm: "w-10 h-14 text-[10px] rounded-lg",
    md: "w-14 h-22 sm:w-16 sm:h-26 text-xs rounded-xl",
    lg: "w-20 h-30 sm:w-24 sm:h-36 text-base rounded-2xl",
  }[size];

  // Face Down Deck Card (Iconic UNO Back)
  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={`${sizeClasses} bg-[#0F1422] border-2 border-white/95 shadow-xl flex flex-col items-center justify-center relative overflow-hidden select-none transition-transform duration-150 ${
          onClick ? "cursor-pointer active:scale-95 hover:scale-105 hover:border-amber-400" : ""
        }`}
      >
        {/* Iconic Tilted Red Oval */}
        <div className="w-[88%] h-[62%] rounded-full bg-gradient-to-tr from-rose-700 via-red-600 to-amber-500 border border-amber-300 shadow-md flex items-center justify-center -rotate-25">
          <span className="font-black italic text-white text-[11px] sm:text-xs tracking-tighter drop-shadow-md">
            UNO
          </span>
        </div>
      </div>
    );
  }

  const colorInfo = COLOR_MAP[card.color];

  // Render Center Symbol
  const renderCenterSymbol = () => {
    switch (card.value) {
      case "skip":
        return (
          <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="9" />
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
          </svg>
        );
      case "reverse":
        return (
          <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M4 12v-3a3 3 0 0 1 3-3h13m0 0l-3-3m3 3l-3 3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 12v3a3 3 0 0 1-3 3H4m0 0l3 3m-3-3l3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "draw2":
        return <span className="font-black italic text-xl sm:text-2xl tracking-tighter drop-shadow-sm">+2</span>;
      case "wild":
        return (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border-2 border-white shadow-md -rotate-12">
            <div className="bg-[#E51B24]" />
            <div className="bg-[#0072CE]" />
            <div className="bg-[#FFC20E]" />
            <div className="bg-[#00A859]" />
          </div>
        );
      case "wild4":
        return (
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border border-white shadow -rotate-12">
              <div className="bg-[#E51B24]" />
              <div className="bg-[#0072CE]" />
              <div className="bg-[#FFC20E]" />
              <div className="bg-[#00A859]" />
            </div>
            <span className="font-black italic text-xs text-white drop-shadow mt-0.5 tracking-tighter">+4</span>
          </div>
        );
      default:
        return (
          <span className="font-black italic text-2xl sm:text-3xl tracking-tight drop-shadow-sm">
            {card.value}
          </span>
        );
    }
  };

  const cornerLabel = card.value === "wild4" ? "+4" : card.value === "draw2" ? "+2" : card.value === "skip" ? "⊘" : card.value === "reverse" ? "⇄" : card.value === "wild" ? "★" : card.value;

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`relative ${sizeClasses} select-none transition-all duration-200 shadow-xl overflow-hidden flex flex-col justify-between p-1 border-2 ${
        colorInfo.bg
      } ${
        isPlayable
          ? "cursor-pointer border-white ring-2 ring-amber-300 drop-shadow-[0_8px_16px_rgba(255,193,7,0.45)] hover:scale-105 active:scale-95"
          : isSelected
          ? "border-amber-400 ring-2 ring-amber-400"
          : "border-white/80"
      }`}
      style={{
        backgroundColor: colorInfo.hex,
      }}
    >
      {/* Corner Value Top-Left */}
      <div className="font-black italic text-white text-[11px] sm:text-xs leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] self-start pl-0.5 pt-0.5">
        {cornerLabel}
      </div>

      {/* Central Tilted White Oval Graphic */}
      <div className="w-[90%] h-[60%] mx-auto bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden relative -rotate-25 border border-black/10">
        <div className={`w-full h-full flex items-center justify-center rotate-25 ${colorInfo.text}`}>
          {renderCenterSymbol()}
        </div>
      </div>

      {/* Corner Value Bottom-Right (Rotated 180) */}
      <div className="font-black italic text-white text-[11px] sm:text-xs leading-none self-end pr-0.5 pb-0.5 rotate-180 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {cornerLabel}
      </div>
    </div>
  );
};
