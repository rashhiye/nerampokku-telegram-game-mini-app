// ==============================================================================
// TELEGRAM-BOT EDGE FUNCTION (WEBHOOK)
// File: supabase/functions/telegram-bot/index.ts
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req) => {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const botUsername = Deno.env.get("VITE_TELEGRAM_BOT_USERNAME") || "GameVerseBot";

  if (!botToken || !supabaseUrl || !supabaseServiceKey) {
    return new Response("Configuration missing", { status: 500 });
  }

  // Verify Webhook Secret Token if set
  if (webhookSecret) {
    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== webhookSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const update = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (update.message) {
      const message = update.message;
      const text = message.text || "";
      const chatId = message.chat.id;
      const chatType = message.chat.type; // 'private' | 'group' | 'supergroup' | 'channel'
      const chatTitle = message.chat.title || "Private Chat";
      const user = message.from;

      // Upsert User Profile
      if (user) {
        await supabase.from("profiles").upsert(
          {
            telegram_id: user.id,
            username: user.username || null,
            first_name: user.first_name,
            last_name: user.last_name || null,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "telegram_id" }
        );
      }

      // Record group when in group or supergroup
      if (chatType === "group" || chatType === "supergroup") {
        await supabase.from("telegram_groups").upsert(
          {
            telegram_chat_id: chatId,
            title: chatTitle,
            chat_type: chatType,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "telegram_chat_id" }
        );
      }

      // Command Router
      if (text.startsWith("/start")) {
        const miniAppUrl = `https://t.me/${botUsername}/gameverse${
          chatType !== "private" ? `?startapp=g_${chatId}` : ""
        }`;

        const replyText =
          `🌟 *Welcome to GAMEVERSE — PLAY TOGETHER!* 🎮\n\n` +
          `Experience high-speed, real-time multiplayer games right inside Telegram:\n\n` +
          `🃏 *UNO* (3–6 Players): Play Action Cards, Reverse, Wild +4 Challenges, and race to 0 cards!\n` +
          `🎲 *LUDO* (4 & 6 Players): Dedicated 4P and 6P hexagonal boards with server-authoritative dice!\n\n` +
          `💬 In-Game Live Chat & Fast Emoji Reactions in every match\\!\n\n` +
          `👉 *Add me to a group* and send /games to play with friends without room codes\\!`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: "MarkdownV2",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Launch GAMEVERSE",
                    url: miniAppUrl,
                  },
                ],
                [
                  {
                    text: "➕ Add to Group",
                    url: `https://t.me/${botUsername}?startgroup=true`,
                  },
                ],
              ],
            },
          }),
        });
      } else if (text.startsWith("/games")) {
        // Group Game Selector
        const miniAppUrl = `https://t.me/${botUsername}/gameverse?startapp=g_${chatId}`;

        const replyText =
          `🎮 *GAMEVERSE MATCH HUB*\n\n` +
          `Ready to play in *${chatTitle}*?\n` +
          `Tap below to join an active room or create a new UNO or LUDO match for this group\\!\n\n` +
          `⚡ No room codes needed — all group members join the same space\\!`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔥 Play in this Group",
                    url: miniAppUrl,
                  },
                ],
              ],
            },
          }),
        });
      } else if (text.startsWith("/help")) {
        const helpText =
          `📖 *GAMEVERSE Help & Game Rules*\n\n` +
          `*UNO (3–6 Players):*\n` +
          `• Match by Color or Number/Symbol\n` +
          `• Skip skips next player\n` +
          `• Reverse reverses direction (skips in 2-player)\n` +
          `• Draw Two adds 2 cards and skips\n` +
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
          `/help — View this guide`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: helpText,
            parse_mode: "Markdown",
          }),
        });
      } else if (text.startsWith("/profile") && user) {
        // Query user statistics
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_id", user.id)
          .single();

        let statsMessage = `👤 *Player Profile: ${user.first_name}*\n\n`;

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

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: statsMessage,
            parse_mode: "Markdown",
          }),
        });
      } else if (text.startsWith("/stats")) {
        // Top 5 leaderboard
        const { data: topPlayers } = await supabase
          .from("player_statistics")
          .select("game_type, wins, win_rate, profiles(first_name, username)")
          .order("wins", { ascending: false })
          .limit(10);

        let leaderboardText = `🏆 *GAMEVERSE Top Players*\n\n`;
        if (topPlayers && topPlayers.length > 0) {
          topPlayers.forEach((p: any, idx: number) => {
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🎖️";
            const name = p.profiles?.first_name || p.profiles?.username || "Player";
            leaderboardText += `${medal} *${name}* — ${p.wins} Wins (${p.game_type.toUpperCase()})\n`;
          });
        } else {
          leaderboardText += `No leaderboard entries yet. Be the first to win!`;
        }

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: leaderboardText,
            parse_mode: "Markdown",
          }),
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
