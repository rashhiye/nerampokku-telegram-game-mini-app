// ==============================================================================
// 4-PLAYER LUDO DEDICATED SVG BOARD
// File: frontend/src/games/ludo/components/Board4P.tsx
// ==============================================================================

import React from "react";
import { LudoGameState, LudoToken } from "../engine/types";
import { getGlobalTrackIndex } from "../engine/ludoEngine";
import { sounds } from "../../../telegram/audio";
import { haptics } from "../../../telegram/haptics";

interface Board4PProps {
  gameState: LudoGameState;
  onTokenClick: (tokenId: string) => void;
}

// 52 Perimeter Track Coordinates (col: 0..14, row: 0..14)
const TRACK_COORDS_4P: [number, number][] = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], // 0-4 (0 = Red Start)
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], // 5-10 (8 = Star)
  [7, 0], [8, 0], // 11-12
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], // 13-17 (13 = Green Start)
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], // 18-23 (21 = Star)
  [14, 7], [14, 8], // 24-25
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], // 26-30 (26 = Yellow Start)
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], // 31-36 (34 = Star)
  [7, 14], [6, 14], // 37-38
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], // 39-43 (39 = Blue Start)
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], // 44-49 (47 = Star)
  [0, 7], [0, 6], // 50-51
];

// Colored Home Stretch Runway Coordinates (5 steps each)
const HOME_RUNWAYS_4P: Record<number, [number, number][]> = {
  0: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],       // Red (Rightwards)
  1: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],       // Green (Downwards)
  2: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],   // Yellow (Leftwards)
  3: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],   // Blue (Upwards)
};

// Base / Yard Coordinates for 4 tokens
const BASE_SLOTS_4P: Record<number, [number, number][]> = {
  0: [[2, 2], [3.5, 2], [2, 3.5], [3.5, 3.5]],         // Red Yard
  1: [[11, 2], [12.5, 2], [11, 3.5], [12.5, 3.5]],     // Green Yard
  2: [[11, 11], [12.5, 11], [11, 12.5], [12.5, 12.5]], // Yellow Yard
  3: [[2, 11], [3.5, 11], [2, 12.5], [3.5, 12.5]],     // Blue Yard
};

export const Board4P: React.FC<Board4PProps> = ({ gameState, onTokenClick }) => {
  const cellSize = 40; // 15 cells * 40 = 600 total width/height

  // Get pixel coordinate (x, y) for any token
  const getTokenPosition = (token: LudoToken): { x: number; y: number } => {
    if (token.step === -1) {
      // In base
      const slot = BASE_SLOTS_4P[token.seat][token.tokenIndex];
      return { x: slot[0] * cellSize + cellSize / 2, y: slot[1] * cellSize + cellSize / 2 };
    }

    if (token.step === gameState.config.finishStep) {
      // Home center (Seat specific offset inside center)
      const centerOffsets: Record<number, [number, number]> = {
        0: [6.8, 7.5],
        1: [7.5, 6.8],
        2: [8.2, 7.5],
        3: [7.5, 8.2],
      };
      const offset = centerOffsets[token.seat];
      return { x: offset[0] * cellSize, y: offset[1] * cellSize };
    }

    if (token.step >= 51) {
      // In home stretch (step 51 to 55)
      const runwayIndex = token.step - 51;
      const coord = HOME_RUNWAYS_4P[token.seat][runwayIndex];
      return { x: coord[0] * cellSize + cellSize / 2, y: coord[1] * cellSize + cellSize / 2 };
    }

    // On common perimeter track
    const globalIdx = getGlobalTrackIndex(token.seat, token.step, gameState.config);
    if (globalIdx !== null) {
      const coord = TRACK_COORDS_4P[globalIdx];
      return { x: coord[0] * cellSize + cellSize / 2, y: coord[1] * cellSize + cellSize / 2 };
    }

    return { x: 300, y: 300 };
  };

  const handleTokenSelect = (tokenId: string) => {
    if (gameState.movableTokenIds.includes(tokenId)) {
      haptics.impact("medium");
      sounds.tokenHop();
      onTokenClick(tokenId);
    }
  };

  // Color theme maps
  const tokenColors: Record<number, { fill: string; stroke: string; glow: string }> = {
    0: { fill: "#EF4444", stroke: "#FEE2E2", glow: "rgba(239, 68, 68, 0.8)" },
    1: { fill: "#10B981", stroke: "#D1FAE5", glow: "rgba(16, 185, 129, 0.8)" },
    2: { fill: "#F59E0B", stroke: "#FEF3C7", glow: "rgba(245, 158, 11, 0.8)" },
    3: { fill: "#3B82F6", stroke: "#DBEAFE", glow: "rgba(59, 130, 246, 0.8)" },
  };

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto p-1 select-none">
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full rounded-3xl shadow-2xl bg-[#0F141E] border-4 border-slate-800"
      >
        <defs>
          <filter id="token-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.6" />
          </filter>
          <radialGradient id="red-yard-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </radialGradient>
          <radialGradient id="green-yard-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#065F46" />
          </radialGradient>
          <radialGradient id="yellow-yard-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </radialGradient>
          <radialGradient id="blue-yard-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </radialGradient>
        </defs>

        {/* 1. Four Bases / Yards */}
        {/* Red Base (Top-Left) */}
        <rect x="0" y="0" width="240" height="240" fill="url(#red-yard-grad)" rx="20" />
        <rect x="30" y="30" width="180" height="180" fill="#161B26" rx="16" stroke="#EF4444" strokeWidth="3" />

        {/* Green Base (Top-Right) */}
        <rect x="360" y="0" width="240" height="240" fill="url(#green-yard-grad)" rx="20" />
        <rect x="390" y="30" width="180" height="180" fill="#161B26" rx="16" stroke="#10B981" strokeWidth="3" />

        {/* Yellow Base (Bottom-Right) */}
        <rect x="360" y="360" width="240" height="240" fill="url(#yellow-yard-grad)" rx="20" />
        <rect x="390" y="390" width="180" height="180" fill="#161B26" rx="16" stroke="#F59E0B" strokeWidth="3" />

        {/* Blue Base (Bottom-Left) */}
        <rect x="0" y="360" width="240" height="240" fill="url(#blue-yard-grad)" rx="20" />
        <rect x="30" y="390" width="180" height="180" fill="#161B26" rx="16" stroke="#3B82F6" strokeWidth="3" />

        {/* Base Token Pods */}
        {[0, 1, 2, 3].map((seat) =>
          BASE_SLOTS_4P[seat].map((slot, i) => (
            <circle
              key={`pod_${seat}_${i}`}
              cx={slot[0] * cellSize + cellSize / 2}
              cy={slot[1] * cellSize + cellSize / 2}
              r="15"
              fill="#0B0E14"
              stroke="#334155"
              strokeWidth="2"
            />
          ))
        )}

        {/* 2. Track Cells (52 Squares) */}
        {TRACK_COORDS_4P.map(([col, row], idx) => {
          const isStar = gameState.config.safeSquares.includes(idx);
          const isRedStart = idx === 0;
          const isGreenStart = idx === 13;
          const isYellowStart = idx === 26;
          const isBlueStart = idx === 39;

          let cellFill = "#161B26";
          if (isRedStart) cellFill = "#EF4444";
          if (isGreenStart) cellFill = "#10B981";
          if (isYellowStart) cellFill = "#F59E0B";
          if (isBlueStart) cellFill = "#3B82F6";

          return (
            <g key={`track_${idx}`}>
              <rect
                x={col * cellSize}
                y={row * cellSize}
                width={cellSize}
                height={cellSize}
                fill={cellFill}
                stroke="#1F293D"
                strokeWidth="1.5"
                rx="4"
              />
              {/* Star Safe Spot Icon */}
              {isStar && (
                <text
                  x={col * cellSize + cellSize / 2}
                  y={row * cellSize + cellSize / 2 + 5}
                  fontSize="18"
                  textAnchor="middle"
                  fill="#FBBF24"
                  fontWeight="bold"
                >
                  ★
                </text>
              )}
            </g>
          );
        })}

        {/* 3. Colored Home Runways (5 cells each) */}
        {/* Red Home Stretch */}
        {HOME_RUNWAYS_4P[0].map(([col, row], i) => (
          <rect
            key={`red_home_${i}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#EF4444"
            stroke="#991B1B"
            strokeWidth="1.5"
            rx="4"
          />
        ))}
        {/* Green Home Stretch */}
        {HOME_RUNWAYS_4P[1].map(([col, row], i) => (
          <rect
            key={`green_home_${i}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#10B981"
            stroke="#065F46"
            strokeWidth="1.5"
            rx="4"
          />
        ))}
        {/* Yellow Home Stretch */}
        {HOME_RUNWAYS_4P[2].map(([col, row], i) => (
          <rect
            key={`yellow_home_${i}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#F59E0B"
            stroke="#92400E"
            strokeWidth="1.5"
            rx="4"
          />
        ))}
        {/* Blue Home Stretch */}
        {HOME_RUNWAYS_4P[3].map(([col, row], i) => (
          <rect
            key={`blue_home_${i}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth="1.5"
            rx="4"
          />
        ))}

        {/* 4. Central Home Triangles */}
        <polygon points="240,240 300,300 240,360" fill="#EF4444" stroke="#0B0E14" strokeWidth="2" />
        <polygon points="240,240 300,300 360,240" fill="#10B981" stroke="#0B0E14" strokeWidth="2" />
        <polygon points="360,240 300,300 360,360" fill="#F59E0B" stroke="#0B0E14" strokeWidth="2" />
        <polygon points="240,360 300,300 360,360" fill="#3B82F6" stroke="#0B0E14" strokeWidth="2" />
        <circle cx="300" cy="300" r="18" fill="#161B26" stroke="#FBBF24" strokeWidth="3" />
        <text x="300" y="306" fontSize="16" textAnchor="middle" fill="#FBBF24" fontWeight="black">
          ★
        </text>

        {/* 5. Render All Player Tokens */}
        {[0, 1, 2, 3].map((seat) => {
          const player = gameState.players[seat];
          if (!player) return null;
          const style = tokenColors[seat];

          return player.tokens.map((token) => {
            const pos = getTokenPosition(token);
            const isMovable = gameState.movableTokenIds.includes(token.id);

            return (
              <g
                key={token.id}
                onClick={() => handleTokenSelect(token.id)}
                className={isMovable ? "cursor-pointer" : ""}
                filter="url(#token-shadow)"
              >
                {/* Pulsing ring for movable legal tokens */}
                {isMovable && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="20"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    className="animate-ping opacity-75"
                  />
                )}
                {/* Token Outer Body */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="14"
                  fill={style.fill}
                  stroke={isMovable ? "#FFFFFF" : style.stroke}
                  strokeWidth={isMovable ? "3.5" : "2"}
                  className="transition-all duration-300"
                />
                {/* Token Crown Inner Ring */}
                <circle cx={pos.x} cy={pos.y} r="7" fill="#FFFFFF" fillOpacity="0.4" />
                <circle cx={pos.x} cy={pos.y} r="3" fill="#FFFFFF" />
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};
