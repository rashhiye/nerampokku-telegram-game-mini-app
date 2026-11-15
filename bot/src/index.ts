// ==============================================================================
// നേരംപോക്ക് (NERAMPOKKU): STANDALONE TELEGRAM BOT RUNNER (grammY)
// Tagline: കളിക്കാം... സമയം പോക്കാം!
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
const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || "NeramPokkuBot";
const appUrl = process.env.VITE_APP_URL || "https://nerampokku.pages.dev";

if (!token) {
  console.error("❌ ERROR: TELEGRAM_BOT_TOKEN is not set in environment!");
  console.error("Please add TELEGRAM_BOT_TOKEN to your .env file.");
  process.exit(1);
}

const bot = new Bot(token);
const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

console.log("🎮 Initializing നേരംപോക്ക് (NeramPokku) Telegram Game Bot...");

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

  let miniAppUrl = `https://t.me/${botUsername}/nerampokku`;
  if (!isPrivate) {
    miniAppUrl += `?startapp=g_${ctx.chat.id}`;
  } else if (startParam) {
    miniAppUrl += `?startapp=${startParam}`;
  }

  const keyboard = new InlineKeyboard()
    .url("🚀 കളിക്കാം നേരംപോക്ക് (Open)", miniAppUrl)
    .row()
    .url("➕ ഗ്രൂപ്പിലേക്ക് ആഡ് ചെയ്യൂ (Add to Group)", `https://t.me/${botUsername}?startgroup=true`);

  await ctx.reply(
    `🌟 *സ്വാഗതം നേരംപോക്കിലേക്ക്!* 🎮\n` +
    `_കളിക്കാം... സമയം പോക്കാം!_\n\n` +
    `ടെലിഗ്രാം ഗ്രൂപ്പിൽ സുഹൃത്തുക്കളോടൊപ്പം തത്സമയം കളിക്കാം:\n\n` +
    `🃏 *UNO* (3–6 Players): Action Cards, Reverse, Wild +4 Challenge, ആവേശപ്പോരാട്ടം!\n` +
    `🎲 *LUDO* (4, 5 & 6 Players): ഒറിജിനൽ 4P, 5P Pentagonal & 6P Hexagonal ബോർഡുകൾ, ലൈവ് ഡൈസ് റോളിംഗ്!\n\n` +
    `💬 ഇൻ-ഗെയിം ചാറ്റും ലൈവ് ഇമോജി റിയാക്ഷനുകളും!\n\n` +
    `👉 എന്നെ ഒരു ഗ്രൂപ്പിലേക്ക് ആഡ് ചെയ്ത് /games എന്ന് അയക്കൂ! റൂം കോഡ് ആവശ്യമില്ല!`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// /games command (The core group launch trigger)
bot.command("games", async (ctx) => {
  const chatId = ctx.chat.id;
  const chatTitle = ctx.chat.title || "ഗ്രൂപ്പ്";
  const miniAppUrl = `https://t.me/${botUsername}/nerampokku?startapp=g_${chatId}`;

  const keyboard = new InlineKeyboard().url("🔥 കളിക്കാം (Play Now)", miniAppUrl);

  await ctx.reply(
    `🎮 *നേരംപോക്ക് — GAME HUB*\n` +
    `_കളിക്കാം... സമയം പോക്കാം!_\n\n` +
    `*${chatTitle}* ഗ്രൂപ്പിൽ കളിക്കാൻ റെഡിയാണോ?\n` +
    `താഴെ കാണുന്ന ബട്ടൺ അമർത്തി ഉടൻ തന്നെ ഒരു UNO അല്ലെങ്കിൽ LUDO മാച്ചിൽ പങ്കുചേരൂ!\n\n` +
    `⚡ റൂം കോഡ് ആവശ്യമില്ല — ഗ്രൂപ്പിലുള്ള എല്ലാവർക്കും നേരിട്ട് കയറാം!`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// /help command
bot.command("help", async (ctx) => {
  await ctx.reply(
    `📖 *നേരംപോക്ക് — ഗെയിം റൂളുകൾ (Game Rules)*\n\n` +
    `*UNO (3–6 Players):*\n` +
    `• കളറിലോ നമ്പറിലോ ചിഹ്നത്തിലോ മാച്ച് ചെയ്യുക\n` +
    `• Skip, Reverse, Draw Two (+2) ആക്ഷൻ കാർഡുകൾ\n` +
    `• Wild +4 ചലഞ്ച് ചെയ്യാം!\n` +
    `• കയ്യിൽ 1 കാർഡ് ആവുമ്പോൾ "UNO!" എന്ന് വിളിക്കുക\n\n` +
    `*LUDO (4, 5 & 6 Players):*\n` +
    `• ബേസിൽ നിന്ന് ഇറങ്ങാൻ 6 വീഴണം\n` +
    `• 6 വീണാൽ എക്സ്ട്രാ റോൾ (തുടർച്ചയായി 3 പ്രാവശ്യം 6 വീണാൽ ചാൻസ് പോകും)\n` +
    `• എതിരാളിയുടെ കോയിൻ വെട്ടാം; സ്റ്റാർ കട്ടകൾ 100% സേഫ് ആണ്\n` +
    `• 4 കോയിനുകളും ഹോമിൽ എത്തിക്കുന്നയാൾ വിജയിക്കും!\n\n` +
    `*കമാൻഡുകൾ:*\n` +
    `/games — ഗ്രൂപ്പ് മാച്ച് ഹബ് തുറക്കാൻ\n` +
    `/profile — നിങ്ങളുടെ സ്റ്റാറ്റ്സ് കാണാൻ\n` +
    `/stats — ലീഡർബോർഡ് കാണാൻ\n` +
    `/help — ഈ ഗൈഡ് കാണാൻ`,
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
  let leaderboardText = `🏆 *നേരംപോക്ക് — Top Players*\n\n`;

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
    console.log(`✅ നേരംപോക്ക് Game Bot started successfully as @${botInfo.username}`);
    console.log(`🔗 WebApp Link: https://t.me/${botInfo.username}/nerampokku`);
  },
});
