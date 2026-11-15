// ==============================================================================
// നേരംപോക്ക് (NERAMPOKKU) OFFICIAL LOGO COMPONENT
// File: frontend/src/components/common/Logo.tsx
// ==============================================================================

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showTagline = true,
  className = "",
}) => {
  const badgeSizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
  }[size];

  const titleSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  }[size];

  const descSizes = {
    sm: "text-[9px]",
    md: "text-[11px]",
    lg: "text-xs",
  }[size];

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Original Gaming Badge Icon (Combining Card, Dice & Play Sparks) */}
      <div className={`relative ${badgeSizes} flex-shrink-0 flex items-center justify-center`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-500 blur-sm opacity-70 animate-pulse-subtle" />

        {/* Outer Hex-Rounded Badge */}
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-2 border-amber-400/80 shadow-xl flex items-center justify-center overflow-hidden">
          <svg
            className="w-4/5 h-4/5"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Tilted Playing Card */}
            <rect
              x="8"
              y="10"
              width="18"
              height="26"
              rx="4"
              transform="rotate(-12 8 10)"
              fill="#EF4444"
              stroke="#FFF"
              strokeWidth="2"
            />
            {/* Tilted Die */}
            <rect
              x="20"
              y="14"
              width="20"
              height="20"
              rx="4"
              transform="rotate(10 20 14)"
              fill="#F59E0B"
              stroke="#FFF"
              strokeWidth="2"
            />
            {/* Die Dots */}
            <circle cx="27" cy="21" r="2" fill="#1E293B" />
            <circle cx="33" cy="27" r="2" fill="#1E293B" />
            <circle cx="30" cy="24" r="2" fill="#DC2626" />
            {/* Play Sparkle */}
            <path
              d="M38 8L39.5 12.5L44 14L39.5 15.5L38 20L36.5 15.5L32 14L36.5 12.5L38 8Z"
              fill="#38BDF8"
            />
          </svg>
        </div>
      </div>

      {/* Typography Block */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5 leading-none">
          {/* Official Malayalam Name */}
          <h1
            className={`font-black ${titleSizes} tracking-tight bg-gradient-to-r from-amber-300 via-rose-400 to-indigo-400 bg-clip-text text-transparent`}
            style={{ fontFamily: "'Noto Sans Malayalam', sans-serif" }}
          >
            നേരംപോക്ക്
          </h1>
          {/* English Descriptor */}
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded-md border border-indigo-700/60 font-display">
            GAME BOT
          </span>
        </div>

        {/* Tagline */}
        {showTagline && (
          <p
            className={`text-slate-400 font-bold ${descSizes} mt-0.5 tracking-normal`}
            style={{ fontFamily: "'Noto Sans Malayalam', sans-serif" }}
          >
            കളിക്കാം... സമയം പോക്കാം!
          </p>
        )}
      </div>
    </div>
  );
};
