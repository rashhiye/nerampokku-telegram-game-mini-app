// ==============================================================================
// 6-PLAYER DEDICATED HEXAGONAL LUDO SVG BOARD
// File: frontend/src/games/ludo/components/Board6P.tsx
// ==============================================================================

import React from "react";
import { LudoGameState, LudoToken } from "../engine/types";
import { getGlobalTrackIndex } from "../engine/ludoEngine";
import { sounds } from "../../../telegram/audio";
import { haptics } from "../../../telegram/haptics";

interface Board6PProps {
  gameState: LudoGameState;
  onTokenClick: (tokenId: string) => void;
}

// 6 Colors
const COLOR_HEX: Record<number, { main: string; bg: string; stroke: string; label: string }> = {
  0: { main: "#EF4444", bg: "#991B1B", stroke: "#FEE2E2", label: "Red" },
  1: { main: "#10B981", bg: "#065F46", stroke: "#D1FAE5", label: "Green" },
  2: { main: "#F59E0B", bg: "#92400E", stroke: "#FEF3C7", label: "Yellow" },
  3: { main: "#3B82F6", bg: "#1E40AF", stroke: "#DBEAFE", label: "Blue" },
  4: { main: "#F97316", bg: "#9A3412", stroke: "#FFEDD5", label: "Orange" },
  5: { main: "#A855F7", bg: "#6B21A8", stroke: "#F3E8FF", label: "Purple" },
};

export const Board6P: React.FC<Board6PProps> = ({ gameState, onTokenClick }) => {
  const center = 300;
  const radius = 270;

  // Compute (x, y) from polar coordinates (angle in degrees, distance r)
  const polar = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  // Generate 72 Perimeter Track Points
  // 6 arms: Each sector spans 60 degrees. 12 steps per sector = 5 degrees per step.
  const trackCoords: { x: number; y: number; isStar: boolean; isStart: boolean; sector: number }[] = [];
  for (let i = 0; i < 72; i++) {
    const angle = i * 5; // 72 * 5 = 360 deg
    const sector = Math.floor(i / 12);
    const stepInSector = i % 12;
    const isStart = stepInSector === 0;
    const isStar = stepInSector === 7;
    // Radial distance fluctuates along hexagonal perimeter
    const r = radius * 0.92;
    const pt = polar(angle, r);
    trackCoords.push({ ...pt, isStar, isStart, sector });
  }

  // Base slot positions for each of the 6 seats
  // Placed radially at r = 185, centered around each sector's main angle
  const getBaseSlotPosition = (seat: number, tokenIdx: number) => {
    const baseAngle = seat * 60;
    const r = 190;
    const offsets = [
      { da: -5, dr: -15 },
      { da: 5, dr: -15 },
      { da: -5, dr: 15 },
      { da: 5, dr: 15 },
    ];
    const off = offsets[tokenIdx];
    return polar(baseAngle + off.da, r + off.dr);
  };

  // Home runway positions for each of the 6 seats (5 steps leading radially inwards)
  const getHomeRunwayPosition = (seat: number, stepIndex: number) => {
    const angle = seat * 60;
    // Step index 0 to 4: moves from r = 160 down to r = 60
    const r = 165 - stepIndex * 24;
    return polar(angle, r);
  };

  // Map any token to its rendered pixel position
  const getTokenPosition = (token: LudoToken): { x: number; y: number } => {
    if (token.step === -1) {
      return getBaseSlotPosition(token.seat, token.tokenIndex);
    }
    if (token.step === gameState.config.finishStep) {
      // Reached center victory star
      const angle = token.seat * 60;
      return polar(angle, 30);
    }
    if (token.step >= 71) {
      // In home runway (71 to 75)
      const stepIdx = token.step - 71;
      return getHomeRunwayPosition(token.seat, stepIdx);
    }
    // On 72-square perimeter track
    const globalIdx = getGlobalTrackIndex(token.seat, token.step, gameState.config);
    if (globalIdx !== null && trackCoords[globalIdx]) {
      return { x: trackCoords[globalIdx].x, y: trackCoords[globalIdx].y };
    }
    return { x: center, y: center };
  };

  const handleTokenSelect = (tokenId: string) => {
    if (gameState.movableTokenIds.includes(tokenId)) {
      haptics.impact("medium");
      sounds.tokenHop();
      onTokenClick(tokenId);
    }
  };

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto p-1 select-none">
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full rounded-3xl shadow-2xl bg-[#0D111A] border-4 border-slate-800"
      >
        <defs>
          <filter id="hex-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* 1. Hexagonal Board Perimeter Outer Background */}
        <polygon
          points="300,30 534,165 534,435 300,570 66,435 66,165"
          fill="#131926"
          stroke="#1F293D"
          strokeWidth="6"
        />

        {/* 2. Six Colored Bases / Yards */}
        {[0, 1, 2, 3, 4, 5].map((seat) => {
          const angle = seat * 60;
          const pos = polar(angle, 190);
          const style = COLOR_HEX[seat];

          return (
            <g key={`base_${seat}`}>
              {/* Base Outer Circular Pad */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="46"
                fill={style.bg}
                stroke={style.main}
                strokeWidth="3"
                className="opacity-90"
              />
              <circle cx={pos.x} cy={pos.y} r="38" fill="#161B26" />
              {/* 4 Token Recesses */}
              {[0, 1, 2, 3].map((tIdx) => {
                const slot = getBaseSlotPosition(seat, tIdx);
                return (
                  <circle
                    key={`slot_${seat}_${tIdx}`}
                    cx={slot.x}
                    cy={slot.y}
                    r="10"
                    fill="#0B0E14"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          );
        })}

        {/* 3. Six Home Runways Leading to Center */}
        {[0, 1, 2, 3, 4, 5].map((seat) => {
          const style = COLOR_HEX[seat];
          return [0, 1, 2, 3, 4].map((stepIdx) => {
            const pos = getHomeRunwayPosition(seat, stepIdx);
            return (
              <circle
                key={`runway_${seat}_${stepIdx}`}
                cx={pos.x}
                cy={pos.y}
                r="11"
                fill={style.main}
                stroke="#0B0E14"
                strokeWidth="1.5"
                opacity="0.9"
              />
            );
          });
        })}

        {/* 4. The 72 Perimeter Track Nodes */}
        {trackCoords.map((pt, idx) => {
          const style = COLOR_HEX[pt.sector];
          let fill = "#1E2738";
          let stroke = "#334155";
          let radiusNode = 10;

          if (pt.isStart) {
            fill = style.main;
            stroke = "#FFFFFF";
            radiusNode = 12;
          } else if (pt.isStar) {
            fill = "#D97706";
            stroke = "#FDE68A";
          }

          return (
            <g key={`track_${idx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={radiusNode}
                fill={fill}
                stroke={stroke}
                strokeWidth="1.5"
              />
              {pt.isStar && (
                <text
                  x={pt.x}
                  y={pt.y + 4}
                  fontSize="12"
                  textAnchor="middle"
                  fill="#FFF"
                  fontWeight="bold"
                >
                  ★
                </text>
              )}
            </g>
          );
        })}

        {/* 5. Center Victory Hexagon & Star */}
        <polygon
          points="300,255 339,277 339,322 300,345 261,322 261,277"
          fill="#1E293B"
          stroke="#F59E0B"
          strokeWidth="3"
        />
        <text
          x={center}
          y={center + 8}
          fontSize="24"
          textAnchor="middle"
          fill="#F59E0B"
          fontWeight="black"
        >
          ★
        </text>

        {/* 6. Render All Tokens for all 6 seats */}
        {[0, 1, 2, 3, 4, 5].map((seat) => {
          const player = gameState.players[seat];
          if (!player) return null;
          const style = COLOR_HEX[seat];

          return player.tokens.map((token) => {
            const pos = getTokenPosition(token);
            const isMovable = gameState.movableTokenIds.includes(token.id);

            return (
              <g
                key={token.id}
                onClick={() => handleTokenSelect(token.id)}
                className={isMovable ? "cursor-pointer" : ""}
                filter="url(#hex-shadow)"
              >
                {/* Ping ring for legal movable tokens */}
                {isMovable && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="17"
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
                  r="12"
                  fill={style.main}
                  stroke={isMovable ? "#FFFFFF" : style.stroke}
                  strokeWidth={isMovable ? "3" : "1.8"}
                  className="transition-all duration-300"
                />
                {/* Inner Highlight */}
                <circle cx={pos.x} cy={pos.y} r="5" fill="#FFFFFF" fillOpacity="0.4" />
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};
