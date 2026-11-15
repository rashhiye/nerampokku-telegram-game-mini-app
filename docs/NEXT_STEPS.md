# നേരംപോക്ക് (NERAMPOKKU) — COMPLETE OWNER ONBOARDING & LAUNCH GUIDE (NEXT_STEPS.md)

> **Official Name:** നേരംപോക്ക്  
> **English Descriptor:** GAME BOT  
> **Tagline:** കളിക്കാം... സമയം പോക്കാം!  
> **English Description:** Multiplayer Gaming & Entertainment  

Welcome to **നേരംപോക്ക്**! This document was written specifically for you, the project owner. Even if you have never deployed a backend server, database, or Telegram bot before, following this step-by-step guide will take you from local source code to a live, production-ready Telegram gaming platform.

---

## TABLE OF CONTENTS
1. [Accounts to Create](#1-accounts-to-create)
2. [Telegram Bot Setup via @BotFather](#2-telegram-bot-setup-via-botfather)
3. [Supabase Backend & Database Setup](#3-supabase-backend--database-setup)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Frontend Deployment to Cloudflare Pages](#5-frontend-deployment-to-cloudflare-pages)
6. [Connecting the Bot & Mini App in Production](#6-connecting-the-bot--mini-app-in-production)
7. [Running Locally on Windows (PowerShell)](#7-running-locally-on-windows-powershell)
8. [Production Testing Checklist](#8-production-testing-checklist)
9. [Free-Tier Quotas, Costs & Limits](#9-free-tier-quotas-costs--limits)
10. [Troubleshooting Common Issues](#10-troubleshooting-common-issues)
11. [Final Launch Checklist](#11-final-launch-checklist)

---

## 1. ACCOUNTS TO CREATE

All the platforms chosen for GAMEVERSE have generous **100% free tiers**. You do **not** need a paid subscription or credit card to build, test, and launch the platform.

| Platform | Purpose | Free Tier Capabilities | Registration Link |
| :--- | :--- | :--- | :--- |
| **Telegram** | Bot & Mini App hosting | Unlimited bots, groups, and users | [telegram.org](https://telegram.org) |
| **Supabase** | PostgreSQL database, Edge Functions, Realtime | 500 MB database, 50,000 MAU, 500K Edge Function invocations/month | [supabase.com](https://supabase.com) |
| **Cloudflare** | Global CDN frontend hosting (Pages) | Unlimited bandwidth, 500 builds/month, free HTTPS/SSL | [cloudflare.com](https://cloudflare.com) |
| **GitHub** | Code repository & continuous deployment | Unlimited public & private repositories, free Actions CI | [github.com](https://github.com) |

---

## 2. TELEGRAM BOT SETUP VIA @BotFather

You need to register your bot with Telegram's official bot creator, [@BotFather](https://t.me/BotFather).

### Step 2.1: Create the Bot
1. Open the Telegram app on your phone or desktop.
2. In the search bar, search for `@BotFather` (verify the blue checkmark) or open [https://t.me/BotFather](https://t.me/BotFather).
3. Send `/start` to start a conversation.
4. Send the command: `/newbot`.
5. Enter a **Name** for your bot: `നേരംപോക്ക് — GAME BOT`.
6. Enter a **Username** ending in `bot` (e.g., `NeramPokkuBot` or `NeramPokkuGameBot`).
7. BotFather will reply with your **HTTP API Token** formatted like:
   `7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_123456`
   > ⚠️ **CRITICAL:** Copy this token immediately! Keep it secret. Anyone with this token can control your bot.

### Step 2.2: Configure Group Permissions & Privacy
By default, Telegram bots cannot read group messages unless mentioned. To allow `/games` to trigger seamlessly in groups:
1. In `@BotFather`, send `/mybots`.
2. Select your newly created bot from the inline keyboard.
3. Click **Bot Settings** → **Group Privacy** → **Turn off**.
   *(This allows the bot to receive the `/games` command when group members type it).*
4. Click **Back** → **Allow Groups?** → Ensure it is set to **Turn groups on**.

### Step 2.3: Register Bot Commands
To show the command autocomplete menu in Telegram:
1. Send `/setcommands` to `@BotFather`.
2. Select your bot.
3. Paste the following block of text and send:
   ```text
   games - നേരംപോക്ക് ഗ്രൂപ്പ് മാച്ച് ഹബ് (UNO & LUDO)
   start - സ്വാഗതം & വിവരങ്ങൾ (Welcome)
   help - കളി നിയമങ്ങൾ (How to Play)
   profile - നിങ്ങളുടെ പ്രൊഫൈലും സ്റ്റാറ്റ്സും
   stats - ലീഡർബോർഡ് (Leaderboard)
   ```

### Step 2.4: Configure the Telegram Mini App (Web App)
1. In `@BotFather`, send `/newapp`.
2. Select your bot.
3. Enter a Title: `നേരംപോക്ക്`.
4. Enter a Short Description: `കളിക്കാം... സമയം പോക്കാം! Multiplayer UNO & LUDO in Telegram groups.`.
5. Upload a photo/icon (640x360 px suggested) or send `/empty` to skip for now.
6. When prompted for the **Web App URL**, provide:
   - For local development: `https://your-ngrok-or-tunnel-url.com` or placeholder `https://nerampokku.pages.dev`
   - For production: Your Cloudflare Pages URL (e.g., `https://nerampokku.pages.dev`).
7. Enter a short name for the app: `nerampokku`.
8. BotFather will provide your direct Mini App link:
   `https://t.me/<YourBotUsername>/nerampokku`

---

## 3. SUPABASE BACKEND & DATABASE SETUP

Supabase provides your PostgreSQL database, real-time message broadcasting, and serverless Edge Functions.

### Step 3.1: Create a Project
1. Log in to [https://supabase.com](https://supabase.com) and click **"New project"**.
2. **Name**: `gameverse-backend`.
3. **Database Password**: Enter a strong password and save it in a password manager.
4. **Region**: Select the region closest to your primary player base (e.g., `Central EU (Frankfurt)` or `East US (N. Virginia)`).
5. **Pricing Plan**: Choose **Free Tier**.
6. Click **"Create new project"** and wait ~2 minutes for initialization.

### Step 3.2: Retrieve API Keys & URL
1. In your Supabase dashboard, go to **Project Settings** (gear icon on bottom left) → **API**.
2. Locate the following values:
   - **Project URL**: e.g. `https://xyzabcdefghijklmnop.supabase.co`
     *(This is your `VITE_SUPABASE_URL` and `SUPABASE_URL`)*
   - **Project API keys** → `anon` `public`: e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI6...`
     *(This is your `VITE_SUPABASE_ANON_KEY` — public)*
   - **Project API keys** → `service_role` `secret`: e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI6...`
     *(This is your `SUPABASE_SERVICE_ROLE_KEY` — NEVER give this to players or put it in frontend code)*

### Step 3.3: Apply Database Migrations
1. In the Supabase left navigation bar, click **SQL Editor**.
2. Click **"New query"**.
3. Open the file `supabase/migrations/20261115000001_initial_schema.sql` on your computer.
4. Copy all contents, paste into the Supabase SQL Editor, and click **"Run"** (green button).
5. Repeat for:
   - `supabase/migrations/20261115000002_functions_and_rpcs.sql`
   - `supabase/migrations/20261115000003_rls_policies.sql`
   - *(Optional)* `supabase/seed.sql` to populate initial demo data.
6. Verify: Click **Table Editor** on the left menu. You should see all 10 tables: `profiles`, `telegram_groups`, `game_sessions`, `game_players`, `game_settings`, `game_states`, `game_events`, `chat_messages`, `chat_reactions`, and `player_statistics`.

### Step 3.4: Enable Realtime Replication
1. In Supabase, go to **Database** → **Replication**.
2. Under **Source**, locate the `supabase_realtime` publication.
3. Toggle ON the following tables so live changes sync instantly to mobile apps:
   - `game_sessions`
   - `game_players`
   - `game_states`
   - `chat_messages`
   - `chat_reactions`

---

## 4. ENVIRONMENT VARIABLES REFERENCE

Create a file named `.env` in the root folder of your project (copy from `.env.example`).

```env
# ==============================================================================
# FRONTEND PUBLIC VARIABLES (Embedded into Cloudflare Pages build)
# ==============================================================================
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_TELEGRAM_BOT_USERNAME=NeramPokkuBot
VITE_APP_URL=https://nerampokku.pages.dev

# ==============================================================================
# BACKEND SERVER SECRETS (Used by Edge Functions and Telegram Bot)
# NEVER put these in frontend code!
# ==============================================================================
TELEGRAM_BOT_TOKEN=7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_123456
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_WEBHOOK_SECRET=my_super_secret_webhook_passphrase_32_chars
BOT_PORT=3000
```

---

## 5. FRONTEND DEPLOYMENT TO CLOUDFLARE PAGES

Cloudflare Pages provides free, high-speed hosting with worldwide CDN distribution.

### Step 5.1: Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com/new) named `nerampokku`.
2. In Windows PowerShell inside your project folder:
   ```powershell
   git remote add origin https://github.com/<your-username>/nerampokku.git
   git branch -M main
   git push -u origin main
   ```

### Step 5.2: Create Cloudflare Pages Project
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com) and click **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select your `nerampokku` repository.
3. Set the build configuration:
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Expand **Environment variables** and add:
   - `VITE_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJI...`
   - `VITE_TELEGRAM_BOT_USERNAME`: `NeramPokkuBot`
5. Click **"Save and Deploy"**.
6. In ~1 minute, Cloudflare will provide your production URL:
   `https://nerampokku.pages.dev` (or `<your-subdomain>.pages.dev`).

---

## 6. CONNECTING THE BOT & MINI APP IN PRODUCTION

Now, connect your live Cloudflare Pages URL with Telegram and Supabase.

### Step 6.1: Update Mini App URL in BotFather
1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Send `/myapps`.
3. Select `nerampokku`.
4. Click **Edit URL** and enter your production Cloudflare URL:
   `https://nerampokku.pages.dev`

### Step 6.2: Deploy Supabase Edge Functions & Set Webhook
If deploying serverless backend on Supabase:
1. Install Supabase CLI: `npm install -g supabase`.
2. Link your project: `supabase link --project-ref your-project-id`.
3. Set secrets in Supabase:
   ```bash
   supabase secrets set TELEGRAM_BOT_TOKEN="your-bot-token"
   supabase secrets set TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"
   supabase secrets set VITE_TELEGRAM_BOT_USERNAME="YourBotUsername"
   ```
4. Deploy the functions:
   ```bash
   supabase functions deploy auth-verify
   supabase functions deploy telegram-bot
   supabase functions deploy session-manager
   supabase functions deploy game-action
   ```
5. Register the webhook with Telegram:
   Run this in PowerShell (replace values with yours):
   ```powershell
   $BOT_TOKEN="your-telegram-token"
   $WEBHOOK_URL="https://your-project-id.supabase.co/functions/v1/telegram-bot"
   $SECRET="your-webhook-secret"

   Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" `
     -Method Post `
     -ContentType "application/json" `
     -Body (@{ url = $WEBHOOK_URL; secret_token = $SECRET } | ConvertTo-Json)
   ```
   Telegram will respond: `{"ok":true,"result":true,"description":"Webhook was set"}`.

*Alternative:* You can also run the standalone bot from the `bot/` folder on any small Node.js server (such as Railway or Render) with `npm run bot`!

---

## 7. RUNNING LOCALLY ON WINDOWS (POWERSHELL)

You can run the entire frontend, bot, and test suites locally on your Windows computer:

### Step 7.1: Prerequisites
- **Node.js**: v18 or later (already verified installed on your PC: v22.14.0).
- **Git**: Installed.

### Step 7.2: Commands
Open Windows PowerShell in `c:\Users\Muhammed Rashid\Desktop\Telegram Game Bot`:

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Run all 30 automated tests:**
   ```powershell
   npm test
   ```

3. **Start the Frontend development server:**
   ```powershell
   npm run dev
   ```
   Open your browser to `http://localhost:5173`.
   > 💡 **Developer Sandbox Feature:** In browser mode, you will see a top bar allowing you to switch between 4 mock players (**Alex, Sarah, Thomas, Elena**). You can open 4 browser tabs side-by-side to play a full 4-player UNO or LUDO match simultaneously!

4. **Start the Telegram Bot runner (long-polling):**
   In a second PowerShell window:
   ```powershell
   npm run bot
   ```

---

## 8. PRODUCTION TESTING CHECKLIST

Follow this checklist once deployed to verify full platform operation:

- [ ] **Bot Commands:**
  - [ ] Open bot in private chat and send `/start`. Verify welcome message and button.
  - [ ] Send `/help`. Verify game rules text.
  - [ ] Send `/profile`. Verify stats display.
- [ ] **Group Integration:**
  - [ ] Add bot to a Telegram test group.
  - [ ] Type `/games` in the group chat.
  - [ ] Verify bot sends the interactive നേരംപോക്ക് match card.
  - [ ] Tap **"Play in this Group"**. Verify Mini App opens directly to that group's lobby without asking for room codes.
- [ ] **Multiplayer UNO:**
  - [ ] Create a 4-player UNO room.
  - [ ] Have other members tap the link to join seats 1, 2, and 3.
  - [ ] Host taps **Start Match**.
  - [ ] Test card matching by color and value.
  - [ ] Test Action cards: Skip, Reverse, Draw Two.
  - [ ] Test Wild color picker.
  - [ ] Test Wild +4 Challenge mechanic.
  - [ ] Test **Call UNO!** button and **Catch UNO!** penalty.
  - [ ] Verify victory screen and confetti upon play of final card.
- [ ] **Multiplayer LUDO (4-Player):**
  - [ ] Create a 4-player LUDO room.
  - [ ] Test 3D animated dice rolling.
  - [ ] Verify rolling a 6 is required to exit base.
  - [ ] Test extra roll upon rolling a 6.
  - [ ] Test token capture on standard squares vs safe immunity on star squares.
  - [ ] Test exact roll requirement to enter Home center.
- [ ] **Multiplayer LUDO (6-Player Hexagonal):**
  - [ ] Create a 6-player LUDO room.
  - [ ] Verify dedicated hexagonal SVG board with 6 distinct colors and 72-square track.
  - [ ] Test token paths and 6 separate home runways.
- [ ] **In-Game Live Chat:**
  - [ ] Tap floating chat button during gameplay.
  - [ ] Send text messages and verify immediate appearance.
  - [ ] Tap quick reaction emojis (🔥, 👍, 😂) and verify floating particle animation.
  - [ ] Verify unread badge count updates when chat drawer is collapsed.

---

## 9. FREE-TIER QUOTAS, COSTS & LIMITS

| Resource | Free Tier Limit | What Happens if Exceeded | Recommendation |
| :--- | :--- | :--- | :--- |
| **Cloudflare Pages** | Unlimited requests & bandwidth, 500 builds/month | Builds pause until next month; live site stays 100% online | Zero cost risk. |
| **Supabase Database** | 500 MB storage | Read-only mode until old records archived | Automatic vacuum job cleans matches > 30 days old. |
| **Supabase Realtime** | 200 concurrent WebSocket connections | New connections queued or rejected | Supports ~40 simultaneous 4P matches. |
| **Supabase Edge Functions** | 500,000 invocations / month | Function calls throttle | Plenty for 25,000+ full matches / month. |

---

## 10. TROUBLESHOOTING COMMON ISSUES

### Issue 1: Telegram Bot does not respond to `/games` in groups
- **Cause:** Bot group privacy mode is still enabled in BotFather.
- **Fix:** Open [@BotFather](https://t.me/BotFather) → `/mybots` → select your bot → **Bot Settings** → **Group Privacy** → **Turn off**. Then remove the bot from the group and re-add it.

### Issue 2: Mini App shows blank white screen
- **Cause:** Missing environment variables during Cloudflare build.
- **Fix:** Go to Cloudflare Pages → your project → **Settings** → **Environment variables** → Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present, then click **Retry deployment**.

### Issue 3: "Cryptographic signature mismatch" in authentication
- **Cause:** The `TELEGRAM_BOT_TOKEN` in Supabase Secrets does not match the token from BotFather.
- **Fix:** Re-check your token in BotFather and run `supabase secrets set TELEGRAM_BOT_TOKEN="exact_token"`.

### Issue 4: Chat messages do not update in real-time
- **Cause:** Supabase Realtime publication is not enabled for `chat_messages`.
- **Fix:** In Supabase dashboard, go to **Database** → **Replication** → ensure `chat_messages` is toggled ON.

---

## 11. FINAL LAUNCH CHECKLIST

Follow these 12 final steps to launch നേരംപോക്ക് to your community:
1. [ ] Create accounts on GitHub, Cloudflare, and Supabase.
2. [ ] Create bot via [@BotFather](https://t.me/BotFather) and disable Group Privacy.
3. [ ] Create Mini App in BotFather via `/newapp` and note short name `nerampokku`.
4. [ ] Create Supabase project and save API keys.
5. [ ] Execute the 3 SQL migration scripts in Supabase SQL Editor.
6. [ ] Enable Realtime replication for game and chat tables.
7. [ ] Push repository to GitHub.
8. [ ] Connect GitHub repository to Cloudflare Pages and deploy.
9. [ ] Update Mini App URL in BotFather to your production Cloudflare HTTPS link.
10. [ ] Set Telegram webhook or run the bot server.
11. [ ] Add your bot to your community group.
12. [ ] Send `/games`, invite your group members, and **കളിക്കാം... സമയം പോക്കാം!** 🎮
