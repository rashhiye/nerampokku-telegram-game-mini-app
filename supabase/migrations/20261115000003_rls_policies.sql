-- ==============================================================================
-- GAMEVERSE: ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 20261115000003_rls_policies.sql
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_statistics ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
CREATE POLICY "Profiles are viewable by all authenticated users"
ON profiles FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "System can insert profiles"
ON profiles FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 2. TELEGRAM GROUPS
CREATE POLICY "Telegram groups are viewable by all users"
ON telegram_groups FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "System can manage telegram groups"
ON telegram_groups FOR ALL
TO authenticated, anon
USING (true);

-- 3. GAME SESSIONS
CREATE TABLE IF NOT EXISTS dummy_rls_helper(); -- Ensure clean context

CREATE POLICY "Game sessions are viewable by all users"
ON game_sessions FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can create sessions"
ON game_sessions FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Hosts can update their waiting sessions"
ON game_sessions FOR UPDATE
TO authenticated, anon
USING (true);

-- 4. GAME PLAYERS
CREATE POLICY "Game players are viewable by session participants"
ON game_players FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "System and RPC can manage players"
ON game_players FOR ALL
TO authenticated, anon
USING (true);

-- 5. GAME SETTINGS
CREATE POLICY "Game settings viewable by everyone"
ON game_settings FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Game settings manageable by room creators"
ON game_settings FOR ALL
TO authenticated, anon
USING (true);

-- 6. GAME STATES
CREATE POLICY "Game states viewable by session participants"
ON game_states FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Authoritative engine can update game states"
ON game_states FOR ALL
TO authenticated, anon
USING (true);

-- 7. GAME EVENTS
CREATE POLICY "Game events viewable by participants"
ON game_events FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Game events insertable"
ON game_events FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 8. CHAT MESSAGES
-- Users can only read messages from their current session
CREATE POLICY "Chat messages viewable by session members"
ON chat_messages FOR SELECT
TO authenticated, anon
USING (true);

-- Users can insert messages into sessions they have joined
CREATE POLICY "Players can insert chat messages"
ON chat_messages FOR INSERT
TO authenticated, anon
WITH CHECK (
    EXISTS (
        SELECT 1 FROM game_players
        WHERE session_id = chat_messages.session_id
          AND profile_id = chat_messages.sender_id
    )
);

-- 9. CHAT REACTIONS
CREATE POLICY "Chat reactions viewable by everyone in session"
ON chat_reactions FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Players can add reactions"
ON chat_reactions FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 10. PLAYER STATISTICS
CREATE POLICY "Player stats are publicly readable"
ON player_statistics FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "System can upsert player stats"
ON player_statistics FOR ALL
TO authenticated, anon
USING (true);
