// ==============================================================================
// AUTH-VERIFY EDGE FUNCTION
// File: supabase/functions/auth-verify/index.ts
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { validateTelegramInitData } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-init-data",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { initDataRaw } = await req.json();
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!botToken || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server environment misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cryptographic validation
    const validation = await validateTelegramInitData(initDataRaw, botToken);
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({ error: "Invalid Telegram authentication", details: validation.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tgUser = validation.data.user;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert Profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          telegram_id: tgUser.id,
          username: tgUser.username || null,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name || null,
          photo_url: tgUser.photo_url || null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "telegram_id" }
      )
      .select()
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Failed to sync profile", details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        telegramContext: {
          chat_type: validation.data.chat_type,
          chat_instance: validation.data.chat_instance,
          start_param: validation.data.start_param,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
