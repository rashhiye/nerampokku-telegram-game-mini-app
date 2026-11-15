// ==============================================================================
// GAMEVERSE: STANDALONE TELEGRAM BOT RUNNER (grammY)
// File: bot/src/index.ts
// ==============================================================================

import { Bot, InlineKeyboard } from "grammy";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from project root if present
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || "GameVerseBot";
const appUrl = process.env.VITE_APP_URL || "https://gameverse.pages.dev";

if (!token) {
  console.error("❌ ERROR: TELEGRAM_BOT_TOKEN is not set in environment!");
  console.error("Please add TELEGRAM_BOT_TOKEN to your .env file.");
  process.exit(1);
}

const bot = new Bot(token);
const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

console.log("🎮 Initializing GAMEVERSE Telegram Bot...");

// Middleware: Sync user and group to Supabase
bot.use(async (ctx, next) => {
  if (supabase && ctx.from) {
    try {
      await supabase.from("profiles").upsert(
        {
          telegram_id: ctx.from.id,
          username: ctx.from.username || null,
          first_name: ctx.from.first_name,
          last_name: ctx.from.last_name || null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "telegram_id" }
      );

      if (ctx.chat && (ctx.chat.type === "group" || ctx.chat.type === "supergroup")) {
        await supabase.from("telegram_groups").upsert(
          {
            telegram_chat_id: ctx.chat.id,
            title: ctx.chat.title || "Group",
            chat_type: ctx.chat.type,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "telegram_chat_id" }
        );
      }
    } catch (err: any) {
      console.warn("⚠️ Warning: Supabase sync skipped:", err.message);
    }
  }
  return next();
});

// /start command
bot.command("start", async (ctx) => {
  const isPrivate = ctx.chat.type === "private";
  const startParam = ctx.match; // e.g. g_-1001234567

  let miniAppUrl = `https://t.me/${botUsername}/gameverse`;
  if (!isPrivate) {
    miniAppUrl += `?startapp=g_${ctx.chat.id}`;
  } else if (startParam) {
    miniAppUrl += `?startapp=${startParam}`;
  }

  const keyboard = new InlineKeyboard()
    .url("🚀 Launch GAMEVERSE", miniAppUrl)
    .row()
    .url("➕ Add to Group", `https://t.me/${botUsername}?startgroup=true`);

  await ctx.reply(
    `🌟 *Welcome to GAMEVERSE — PLAY TOGETHER!* 🎮\n\n` +
    `Experience high-speed, real-time multiplayer games right inside Telegram:\n\n` +
    `🃏 *UNO* (3–6 Players): Play Action Cards, Reverse, Wild +4 Challenges, and race to 0 cards!\n` +
    `🎲 *LUDO* (4 & 6 Players): Dedicated 4P and 6P hexagonal boards with server-authoritative dice!\n\n` +
    `💬 In-Game Live Chat & Fast Emoji Reactions in every match!\n\n` +
    `👉 *Add me to a group* and send /games to play with friends without room codes!`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// /games command (The core group launch trigger)
bot.command("games", async (ctx) => {
  const chatId = ctx.chat.id;
  const chatTitle = ctx.chat.title || "this group";
  const miniAppUrl = `https://t.me/${botUsername}/gameverse?startapp=g_${chatId}`;

  const keyboard = new InlineKeyboard().url("🔥 Play in this Group", miniAppUrl);

  await ctx.reply(
    `🎮 *GAMEVERSE MATCH HUB*\n\n` +
    `Ready to play in *${chatTitle}*?\n` +
    `Tap below to join an active room or create a new UNO or LUDO match for this group!\n\n` +
    `⚡ No room codes needed — all group members join the same space!`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// /help command
bot.command("help", async (ctx) => {
  await ctx.reply(
    `📖 *GAMEVERSE Help & Game Rules*\n\n` +
    `*UNO (3–6 Players):*\n` +
    `• Match by Color or Number/Symbol\n` +
    `• Skip skips next player\n` +
    `• Reverse reverses direction (skips in 2-player)\n` +
    `• Draw Two (+2) forces next player to draw 2 and skip\n` +
    `• Wild +4 can be challenged!\n` +
    `• Tap "UNO!" before playing your 2nd-to-last card\n\n` +
    `*LUDO (4 & 6 Players):*\n` +
    `• Roll a 6 to enter the track\n` +
    `• Rolling 6 grants an extra roll (max 3 times)\n` +
    `• Land on opponents to capture and send them to base\n` +
    `• Star squares and start squares are 100% SAFE\n` +
    `• Reach the center with all 4 tokens to win!\n\n` +
    `*Commands:*\n` +
    `/games — Open group games\n` +
    `/profile — View your stats\n` +
    `/stats — View top leaderboard\n` +
    `/help — View this guide`,
    { parse_mode: "Markdown" }
  );
});

// /profile command
bot.command("profile", async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  let statsMessage = `👤 *Player Profile: ${user.first_name}*\n\n`;

  if (supabase) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("telegram_id", user.id)
        .single();

      if (profile) {
        const { data: stats } = await supabase
          .from("player_statistics")
          .select("*")
          .eq("profile_id", profile.id);

        const unoStats = stats?.find((s) => s.game_type === "uno");
        const ludoStats = stats?.find((s) => s.game_type === "ludo");

        statsMessage +=
          `🃏 *UNO:*\n` +
          `• Matches: ${unoStats?.matches_played || 0}\n` +
          `• Wins: ${unoStats?.wins || 0} (${unoStats?.win_rate || 0}%)\n\n` +
          `🎲 *LUDO:*\n` +
          `• Matches: ${ludoStats?.matches_played || 0}\n` +
          `• Wins: ${ludoStats?.wins || 0} (${ludoStats?.win_rate || 0}%)\n`;
      } else {
        statsMessage += `No match history yet. Open /games to play your first match!`;
      }
    } catch {
      statsMessage += `Stats unavailable in offline mode.`;
    }
  } else {
    statsMessage += `Supabase connection not configured.`;
  }

  await ctx.reply(statsMessage, { parse_mode: "Markdown" });
});

// /stats command (Leaderboards)
bot.command("stats", async (ctx) => {
  let leaderboardText = `🏆 *GAMEVERSE Top Players*\n\n`;

  if (supabase) {
    try {
      const { data: topPlayers } = await supabase
        .from("player_statistics")
        .select("game_type, wins, win_rate, profiles(first_name, username)")
        .order("wins", { ascending: false })
        .limit(10);

      if (topPlayers && topPlayers.length > 0) {
        topPlayers.forEach((p: any, idx: number) => {
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🎖️";
          const name = p.profiles?.first_name || p.profiles?.username || "Player";
          leaderboardText += `${medal} *${name}* — ${p.wins} Wins (${p.game_type.toUpperCase()})\n`;
        });
      } else {
        leaderboardText += `No leaderboard entries yet. Be the first to win!`;
      }
    } catch {
      leaderboardText += `Leaderboard currently unavailable.`;
    }
  } else {
    leaderboardText += `Leaderboard database connection pending.`;
  }

  await ctx.reply(leaderboardText, { parse_mode: "Markdown" });
});

// Launch bot with long polling
bot.start({
  onStart: (botInfo) => {
    console.log(`✅ GAMEVERSE Bot started successfully as @${botInfo.username}`);
    console.log(`🔗 WebApp Link: https://t.me/${botInfo.username}/gameverse`);
  },
});
