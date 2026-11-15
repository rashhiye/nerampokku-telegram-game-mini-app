// ==============================================================================
// 6-PLAYER AUTHENTIC CIRCULAR LUDO SVG BOARD (MATCHING REFERENCE IMAGE 2)
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

// 6 Authentic Colors matching reference: Red, Green, Yellow, Blue, Orange, Purple
const COLOR_HEX: Record<number, { main: string; light: string; border: string; name: string }> = {
  0: { main: "#DC2626", light: "#FCA5A5", border: "#991B1B", name: "Red" },      // Red
  1: { main: "#16A34A", light: "#86EFAC", border: "#166534", name: "Green" },    // Green
  2: { main: "#EAB308", light: "#FDE047", border: "#A16207", name: "Yellow" },   // Yellow
  3: { main: "#2563EB", light: "#93C5FD", border: "#1E40AF", name: "Blue" },     // Blue
  4: { main: "#EA580C", light: "#FDBA74", border: "#9A3412", name: "Orange" },   // Orange
  5: { main: "#9333EA", light: "#D8B4FE", border: "#6B21A8", name: "Purple" },   // Purple
};

export const Board6P: React.FC<Board6PProps> = ({ gameState, onTokenClick }) => {
  const center = 300;
  const radius = 280;

  // Polar to Cartesian
  const polar = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  // Generate 72 Perimeter Track Points
  const trackCoords: { x: number; y: number; isStar: boolean; isStart: boolean; sector: number }[] = [];
  for (let i = 0; i < 72; i++) {
    const angle = i * 5; // 72 * 5 = 360 deg
    const sector = Math.floor(i / 12);
    const stepInSector = i % 12;
    const isStart = stepInSector === 0;
    const isStar = stepInSector === 7;
    const r = radius * 0.90;
    const pt = polar(angle, r);
    trackCoords.push({ ...pt, isStar, isStart, sector });
  }

  // Base slot positions for tokens
  const getBaseSlotPosition = (seat: number, tokenIdx: number) => {
    const baseAngle = seat * 60;
    const r = 205;
    const offsets = [
      { da: -4, dr: -14 },
      { da: 4, dr: -14 },
      { da: -4, dr: 14 },
      { da: 4, dr: 14 },
    ];
    const off = offsets[tokenIdx];
    return polar(baseAngle + off.da, r + off.dr);
  };

  // Home runway positions for 5 steps leading into center
  const getHomeRunwayPosition = (seat: number, stepIndex: number) => {
    const angle = seat * 60;
    const r = 165 - stepIndex * 24;
    return polar(angle, r);
  };

  // Map token to coordinates
  const getTokenPosition = (token: LudoToken): { x: number; y: number } => {
    if (token.step === -1) {
      return getBaseSlotPosition(token.seat, token.tokenIndex);
    }
    if (token.step === gameState.config.finishStep) {
      const angle = token.seat * 60;
      return polar(angle, 35);
    }
    if (token.step >= 71) {
      const stepIdx = token.step - 71;
      return getHomeRunwayPosition(token.seat, stepIdx);
    }
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

  // Collect all tokens across players
  const allTokens: LudoToken[] = [];
  Object.values(gameState.players).forEach((p) => {
    if (p && p.tokens) {
      allTokens.push(...p.tokens);
    }
  });

  return (
    <div className="relative w-full max-w-[480px] aspect-square mx-auto p-1 select-none">
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full rounded-full shadow-2xl bg-[#FFFFFF] border-4 border-slate-900 drop-shadow-2xl"
      >
        <defs>
          <filter id="pawn-3d-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* 1. Authentic Circular Board Surface */}
        <circle cx={center} cy={center} r={radius + 8} fill="#F8FAFC" stroke="#0F172A" strokeWidth="6" />

        {/* 2. Six Radial Colored Runway Arms (Middle Column) */}
        {[0, 1, 2, 3, 4, 5].map((seat) => {
          const style = COLOR_HEX[seat];
          const angle = seat * 60;

          return (
            <g key={`arm_${seat}`}>
              {/* Home runway squares */}
              {[0, 1, 2, 3, 4].map((stepIdx) => {
                const pos = getHomeRunwayPosition(seat, stepIdx);
                return (
                  <rect
                    key={`run_${seat}_${stepIdx}`}
                    x={pos.x - 12}
                    y={pos.y - 12}
                    width="24"
                    height="24"
                    rx="3"
                    fill={style.main}
                    stroke="#0F172A"
                    strokeWidth="1.5"
                    transform={`rotate(${angle} ${pos.x} ${pos.y})`}
                  />
                );
              })}
            </g>
          );
        })}

        {/* 3. The 72 Outer Track Cells */}
        {trackCoords.map((pt, idx) => {
          const style = COLOR_HEX[pt.sector];
          let fill = "#FFFFFF";
          let stroke = "#0F172A";

          if (pt.isStart) {
            fill = style.main;
          } else if (pt.isStar) {
            fill = "#FEF08A"; // Pale yellow star background
          }

          return (
            <g key={`track_${idx}`}>
              <rect
                x={pt.x - 10}
                y={pt.y - 10}
                width="20"
                height="20"
                rx="3"
                fill={fill}
                stroke={stroke}
                strokeWidth="1.2"
              />
              {pt.isStar && (
                <text
                  x={pt.x}
                  y={pt.y + 4}
                  fontSize="12"
                  textAnchor="middle"
                  fill="#D97706"
                  fontWeight="bold"
                >
                  ★
                </text>
              )}
            </g>
          );
        })}

        {/* 4. Six Large Circular Home Bases (Matching Reference Image 2) */}
        {[0, 1, 2, 3, 4, 5].map((seat) => {
          const angle = seat * 60;
          const pos = polar(angle, 205);
          const style = COLOR_HEX[seat];

          return (
            <g key={`base_${seat}`}>
              {/* Base Outer Circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="46"
                fill={style.main}
                stroke="#0F172A"
                strokeWidth="3.5"
                className="drop-shadow"
              />
              {/* Base Inner White Area */}
              <circle cx={pos.x} cy={pos.y} r="38" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
              {/* 4 Token Recesses */}
              {[0, 1, 2, 3].map((tIdx) => {
                const slot = getBaseSlotPosition(seat, tIdx);
                return (
                  <circle
                    key={`slot_${seat}_${tIdx}`}
                    cx={slot.x}
                    cy={slot.y}
                    r="10"
                    fill={style.light}
                    stroke="#0F172A"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          );
        })}

        {/* 5. Center Triangular HOME Finish Zones */}
        {[0, 1, 2, 3, 4, 5].map((seat) => {
          const style = COLOR_HEX[seat];
          const a1 = ((seat * 60 - 30 - 90) * Math.PI) / 180;
          const a2 = ((seat * 60 + 30 - 90) * Math.PI) / 180;
          const rTri = 52;
          const x1 = center + rTri * Math.cos(a1);
          const y1 = center + rTri * Math.sin(a1);
          const x2 = center + rTri * Math.cos(a2);
          const y2 = center + rTri * Math.sin(a2);

          const textAngle = seat * 60;
          const textPos = polar(textAngle, 30);

          return (
            <g key={`tri_${seat}`}>
              <polygon
                points={`${center},${center} ${x1},${y1} ${x2},${y2}`}
                fill={style.main}
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <text
                x={textPos.x}
                y={textPos.y + 3}
                fontSize="7"
                fontWeight="900"
                textAnchor="middle"
                fill="#FFFFFF"
                transform={`rotate(${textAngle} ${textPos.x} ${textPos.y})`}
              >
                HOME
              </text>
            </g>
          );
        })}

        {/* Center Target Hub */}
        <circle cx={center} cy={center} r="16" fill="#EF4444" stroke="#0F172A" strokeWidth="2.5" />
        <circle cx={center} cy={center} r="6" fill="#FFFFFF" />

        {/* 6. Pawns / Tokens (Rendered with 3D shadow and pulsing selection) */}
        {allTokens.map((token) => {
          const pos = getTokenPosition(token);
          const style = COLOR_HEX[token.seat] || COLOR_HEX[0];
          const isMovable = gameState.movableTokenIds.includes(token.id);

          return (
            <g
              key={token.id}
              onClick={() => handleTokenSelect(token.id)}
              className={`transition-all duration-300 ${
                isMovable ? "cursor-pointer" : "pointer-events-none"
              }`}
            >
              {/* Pulsing ring if movable */}
              {isMovable && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="19"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="3.5"
                  className="animate-ping opacity-75"
                />
              )}

              {/* 3D Pawn Base */}
              <ellipse
                cx={pos.x}
                cy={pos.y + 4}
                rx="11"
                ry="6"
                fill="#0F172A"
                opacity="0.3"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r="12"
                fill={style.main}
                stroke="#0F172A"
                strokeWidth="2"
                filter="url(#pawn-3d-shadow)"
              />
              {/* 3D Pawn Top Head */}
              <circle
                cx={pos.x - 2}
                cy={pos.y - 2}
                r="5"
                fill={style.light}
                opacity="0.8"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
