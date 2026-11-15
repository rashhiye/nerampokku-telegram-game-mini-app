# 🎮 നേരംപോക്ക് — GAME BOT

> **കളിക്കാം... സമയം പോക്കാം!**  
> **Multiplayer Gaming & Entertainment for Telegram Mini Apps** featuring two fully-playable multiplayer games: **UNO** (3–6 Players) and **LUDO** (4, 5 & 6 Players Dedicated Boards).

[![Brand](https://img.shields.io/badge/Brand-നേരംപോക്ക്-EF4444.svg)]()
[![Descriptor](https://img.shields.io/badge/Descriptor-GAME%20BOT-F59E0B.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime%20%26%20Postgres-3ECF8E.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-30%20Passed%20(100%25)-brightgreen.svg)]()

---

## 🌟 ഉൽപ്പന്ന സവിശേഷതകൾ (Key Features)

- **Official Name:** **നേരംപോക്ക്** (NeramPokku)
- **Tagline:** **കളിക്കാം... സമയം പോക്കാം!**
- **One Bot, One Mini App:** ഗ്രൂപ്പ് അംഗങ്ങൾക്ക് `/games` എന്ന് അയച്ച് റൂം കോഡ് ഇല്ലാതെ നേരിട്ട് കളിക്കാം.
- **Authoritative UNO Engine (3–6 Players):**
  - 108/112 കാർഡ് ഡെക്ക് വിത്ത് ക്രിപ്റ്റോഗ്രാഫിക് ഷഫിൾ.
  - Skip, Reverse, Draw Two (+2), Wild, and Wild +4 with Challenge mechanics.
  - Configurable house rules (+2/+4 stacking, jump-in, 7-0 hand rotation).
  - "Call UNO!" and "Catch UNO!" grace periods and penalty draws.
  - Original vector card artwork and responsive poker table layout.
- **Authoritative LUDO Engine (4, 5 & 6 Players):**
  - Dedicated 4-Player 15x15 board, Dedicated 5-Player Pentagonal board & Dedicated 6-Player Hexagonal board.
  - Server-authoritative dice rolling (CSPRNG).
  - Starting base exit on 6, extra turns, and three consecutive sixes penalty.
  - Opponent captures on non-safe squares; Star squares 100% safe.
  - Exact roll to enter Home center.
- **In-Game Live Chat & Reactions:**
  - കളിക്കിടയിൽ തന്നെ മെസ്സേജ് അയക്കാവുന്ന ലൈവ് ചാറ്റ് ഡ്രോയർ.
  - Instant one-tap emoji reactions (`🔥`, `👍`, `😂`, `🎉`, `😱`) with floating particle effects.
  - Per-match channel isolation and client-side anti-spam limits.
- **Player Profiles & Leaderboards:**
  - വെരിഫൈഡ് ടെലിഗ്രാം പ്രൊഫൈൽ (പേര്, യൂസർനെയിം, ഡിപി).
  - വിൻ/ലോസ് സ്റ്റാറ്റിസ്റ്റിക്സും വിൻ റേറ്റ് ശതമാനവും.
  - ഗ്ലോബൽ, ഗ്രൂപ്പ് ലീഡർബോർഡുകൾ.
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
MIT License. Created for the **നേരംപോക്ക്** platform.
