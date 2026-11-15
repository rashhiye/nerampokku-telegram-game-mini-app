# 🎮 GAMEVERSE — PLAY TOGETHER

> **Complete Telegram Mini App Gaming Platform** featuring two fully-playable multiplayer games: **UNO** (3–6 Players) and **LUDO** (4 & 6 Players Dedicated Boards).

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime%20%26%20Postgres-3ECF8E.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-30%20Passed%20(100%25)-brightgreen.svg)]()

---

## 🌟 Key Features

- **One Bot, One Mini App:** Group members launch `/games` directly in Telegram groups and join matches with zero room codes.
- **Authoritative UNO Engine (3–6 Players):**
  - 108/112-card deck generator with cryptographic shuffle.
  - Skip, Reverse, Draw Two, Wild, and Wild +4 with Challenge mechanics.
  - Configurable house rules (+2/+4 stacking, jump-in, 7-0 hand rotation).
  - "Call UNO!" and "Catch UNO!" grace periods and penalty draws.
  - Original SVG card graphics and circular table layouts.
- **Authoritative LUDO Engine (4 & 6 Players):**
  - Dedicated 4-Player 15x15 board & Dedicated 6-Player Hexagonal board.
  - Server-authoritative dice rolling (CSPRNG).
  - Starting base exit on 6, extra turns, and three consecutive sixes penalty.
  - Opponent captures on non-safe squares; Star squares 100% safe.
  - Exact roll to enter Home center.
- **In-Game Live Chat & Reactions:**
  - Real-time text messaging drawer accessible during active gameplay.
  - Instant one-tap emoji reactions (`🔥`, `👍`, `😂`, `🎉`, `😱`) with floating particle effects.
  - Per-match channel isolation and client-side anti-spam limits.
- **Player Profiles & Leaderboards:**
  - Verified Telegram identity (username, name, avatar).
  - Win/loss statistics and win percentage tracking.
  - Global and group rankings for UNO and LUDO.
- **Built-in Developer Sandbox:**
  - Instant local browser testing with multi-player switching (Alex, Sarah, Thomas, Elena) without needing multiple Telegram accounts!

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```powershell
npm install
```

### 2. Run Automated Unit & Integration Tests (30 tests)
```powershell
npm test
```

### 3. Start Frontend Development Server
```powershell
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Telegram Bot (Long-Polling)
```powershell
npm run bot
```

---

## 📖 Complete Documentation

Detailed guides and references are available in the [`docs/`](./docs) folder:
- **[NEXT_STEPS.md](./docs/NEXT_STEPS.md)**: **Beginner-friendly step-by-step owner onboarding and launch guide.**
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)**: System design and state synchronization.
- **[DATABASE.md](./docs/DATABASE.md)**: PostgreSQL schemas, RLS policies, and RPC stored procedures.
- **[API_REFERENCE.md](./docs/API_REFERENCE.md)**: REST & Edge Function request/response specifications.
- **[GAME_RULES.md](./docs/GAME_RULES.md)**: Complete UNO and LUDO rulebooks.
- **[SECURITY.md](./docs/SECURITY.md)**: HMAC-SHA256 verification and cheat prevention.
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)**: Cloudflare Pages & Supabase deployment.
- **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)**: Common issues and solutions.

---

## 📄 License
MIT License. Created for the GAMEVERSE platform.
