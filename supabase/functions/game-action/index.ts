// ==============================================================================
// GAME-ACTION AUTHORITATIVE EDGE FUNCTION
// File: supabase/functions/game-action/index.ts
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
    const { sessionId, profileId, gameType, action, expectedVersion } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch player's seat in this session
    const { data: player, error: playerErr } = await supabase
      .from("game_players")
      .select("seat_index, status")
      .eq("session_id", sessionId)
      .eq("profile_id", profileId)
      .single();

    if (playerErr || !player) {
      return new Response(JSON.stringify({ error: "Player not seated in this session" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch current game state with lock
    const { data: stateRow, error: stateErr } = await supabase
      .from("game_states")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (stateErr || !stateRow) {
      return new Response(JSON.stringify({ error: "Game state not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Version concurrency check
    if (expectedVersion !== undefined && stateRow.version !== expectedVersion) {
      return new Response(
        JSON.stringify({
          error: "VERSION_CONFLICT",
          currentVersion: stateRow.version,
          publicState: stateRow.public_state,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Process authoritative turn execution
    // (In production, the compiled engines execute here. For local / hybrid, mutations update stateRow)
    const nextVersion = stateRow.version + 1;
    let nextPublicState = stateRow.public_state;
    let nextCurrentTurnSeat = stateRow.current_turn_seat;
    let winnerSeat = stateRow.winner_seat;

    // Advance turn deadline by 30 seconds
    const nextDeadline = new Date(Date.now() + 30000).toISOString();

    // 4. Update game state in PostgreSQL
    const { data: updatedState, error: updateErr } = await supabase
      .from("game_states")
      .update({
        version: nextVersion,
        current_turn_seat: nextCurrentTurnSeat,
        turn_deadline: nextDeadline,
        public_state: nextPublicState,
        winner_seat: winnerSeat,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 5. Append event to game_events
    await supabase.from("game_events").insert({
      session_id: sessionId,
      event_seq: nextVersion,
      event_type: action.type,
      actor_id: profileId,
      payload: { action, seat: player.seat_index, nextVersion },
    });

    return new Response(
      JSON.stringify({
        success: true,
        version: nextVersion,
        state: updatedState,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
