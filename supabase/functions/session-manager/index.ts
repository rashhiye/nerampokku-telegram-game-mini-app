// ==============================================================================
// SESSION-MANAGER EDGE FUNCTION
// File: supabase/functions/session-manager/index.ts
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const { action, payload, profileId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "create_room") {
      const { groupId, gameType, maxPlayers, settings } = payload;

      // 1. Insert session
      const { data: session, error: sessionErr } = await supabase
        .from("game_sessions")
        .insert({
          group_id: groupId,
          game_type: gameType,
          host_id: profileId,
          min_players: gameType === "ludo" ? 4 : 3,
          max_players: maxPlayers || 4,
          current_player_count: 1,
          status: "waiting",
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      // 2. Insert host as first player in seat 0
      await supabase.from("game_players").insert({
        session_id: session.id,
        profile_id: profileId,
        seat_index: 0,
        status: "waiting",
      });

      // 3. Insert settings if provided
      if (settings) {
        await supabase.from("game_settings").insert({
          session_id: session.id,
          ...settings,
        });
      }

      return new Response(
        JSON.stringify({ success: true, session }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "join_room") {
      const { sessionId } = payload;
      const { data, error } = await supabase.rpc("join_game_session", {
        p_session_id: sessionId,
        p_profile_id: profileId,
      });

      if (error) throw error;
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "leave_room") {
      const { sessionId } = payload;
      const { data, error } = await supabase.rpc("leave_game_session", {
        p_session_id: sessionId,
        p_profile_id: profileId,
      });

      if (error) throw error;
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "start_room") {
      const { sessionId } = payload;
      const { data, error } = await supabase.rpc("start_game_session", {
        p_session_id: sessionId,
        p_profile_id: profileId,
      });

      if (error) throw error;
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
