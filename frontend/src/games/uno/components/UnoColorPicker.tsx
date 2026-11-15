// ==============================================================================
// UNO COLOR PICKER MODAL
// File: frontend/src/games/uno/components/UnoColorPicker.tsx
// ==============================================================================

import React from "react";
import { CardColor } from "../engine/types";
import { haptics } from "../../../telegram/haptics";

interface UnoColorPickerProps {
  isOpen: boolean;
  onSelectColor: (color: CardColor) => void;
}

export const UnoColorPicker: React.FC<UnoColorPickerProps> = ({
  isOpen,
  onSelectColor,
}) => {
  if (!isOpen) return null;

  const colors: { name: CardColor; label: string; bg: string; border: string }[] = [
    { name: "red", label: "Red", bg: "bg-red-500 hover:bg-red-600", border: "border-red-300" },
    { name: "blue", label: "Blue", bg: "bg-blue-500 hover:bg-blue-600", border: "border-blue-300" },
    { name: "yellow", label: "Yellow", bg: "bg-amber-400 hover:bg-amber-500", border: "border-amber-200" },
    { name: "green", label: "Green", bg: "bg-emerald-500 hover:bg-emerald-600", border: "border-emerald-300" },
  ];

  const handlePick = (c: CardColor) => {
    haptics.selection();
    onSelectColor(c);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161B26] border-2 border-indigo-500/50 rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center">
        <h3 className="text-xl font-extrabold text-white mb-2">Choose Wild Color</h3>
        <p className="text-xs text-slate-400 mb-6">Pick the color for the next play:</p>

        <div className="grid grid-cols-2 gap-4">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => handlePick(c.name)}
              className={`${c.bg} ${c.border} border-2 text-white font-black py-5 rounded-2xl shadow-lg transition-transform active:scale-95 text-base uppercase tracking-wider flex items-center justify-center`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
