-- ==============================================================================
-- GAMEVERSE: DATABASE INITIAL SCHEMA MIGRATION
-- Migration: 20261115000001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing types if re-running
DO $$ BEGIN
    CREATE TYPE game_type_enum AS ENUM ('uno', 'ludo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status_enum AS ENUM ('waiting', 'in_progress', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE player_status_enum AS ENUM ('waiting', 'ready', 'playing', 'disconnected', 'left');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);

-- 2. TELEGRAM GROUPS
CREATE TABLE IF NOT EXISTS telegram_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_chat_id BIGINT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    chat_type TEXT NOT NULL DEFAULT 'group',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telegram_groups_chat_id ON telegram_groups(telegram_chat_id);

-- 3. GAME SESSIONS
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES telegram_groups(id) ON DELETE CASCADE,
    game_type game_type_enum NOT NULL,
    status session_status_enum NOT NULL DEFAULT 'waiting',
    host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    min_players INT NOT NULL DEFAULT 2 CHECK (min_players >= 2),
    max_players INT NOT NULL CHECK (max_players >= 2 AND max_players <= 6),
    current_player_count INT NOT NULL DEFAULT 1 CHECK (current_player_count <= max_players),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_game_sessions_group_status ON game_sessions(group_id, status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);

-- 4. GAME PLAYERS
CREATE TABLE IF NOT EXISTS game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seat_index INT NOT NULL CHECK (seat_index >= 0 AND seat_index < 6),
    status player_status_enum NOT NULL DEFAULT 'waiting',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_profile UNIQUE (session_id, profile_id),
    CONSTRAINT uq_session_seat UNIQUE (session_id, seat_index)
);
CREATE INDEX IF NOT EXISTS idx_game_players_session ON game_players(session_id);
CREATE INDEX IF NOT EXISTS idx_game_players_profile ON game_players(profile_id);

-- 5. GAME SETTINGS (House rules and session parameters)
CREATE TABLE IF NOT EXISTS game_settings (
    session_id UUID PRIMARY KEY REFERENCES game_sessions(id) ON DELETE CASCADE,
    turn_timer_seconds INT NOT NULL DEFAULT 30 CHECK (turn_timer_seconds BETWEEN 10 AND 120),
    allow_stacking_draw2 BOOLEAN NOT NULL DEFAULT FALSE,
    allow_stacking_draw4 BOOLEAN NOT NULL DEFAULT FALSE,
    allow_jump_in BOOLEAN NOT NULL DEFAULT FALSE,
    allow_seven_zero BOOLEAN NOT NULL DEFAULT FALSE,
    draw_until_playable BOOLEAN NOT NULL DEFAULT FALSE,
    wild_challenge_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ludo_rule_roll_six_to_exit BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. GAME STATES (Authoritative server snapshot)
CREATE TABLE IF NOT EXISTS game_states (
    session_id UUID PRIMARY KEY REFERENCES game_sessions(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    current_turn_seat INT NOT NULL DEFAULT 0,
    turn_direction INT NOT NULL DEFAULT 1, -- +1 Clockwise, -1 Counter-Clockwise
    turn_deadline TIMESTAMPTZ,
    public_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    private_hands JSONB NOT NULL DEFAULT '{}'::jsonb, -- Filtered server-side before sending to players
    winner_seat INT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. GAME EVENTS (Append-only Event Log)
CREATE TABLE IF NOT EXISTS game_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    event_seq INT NOT NULL,
    event_type TEXT NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_event_seq UNIQUE (session_id, event_seq)
);
CREATE INDEX IF NOT EXISTS idx_game_events_session_seq ON game_events(session_id, event_seq);

-- 8. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content VARCHAR(280) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at DESC);

-- 9. CHAT REACTIONS
CREATE TABLE IF NOT EXISTS chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_message_user_emoji UNIQUE (message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON chat_reactions(message_id);

-- 10. PLAYER STATISTICS
CREATE TABLE IF NOT EXISTS player_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    game_type game_type_enum NOT NULL,
    matches_played INT NOT NULL DEFAULT 0,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    win_rate NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN matches_played > 0 THEN ROUND((wins::numeric / matches_played::numeric) * 100, 2) ELSE 0 END
    ) STORED,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_profile_gametype UNIQUE (profile_id, game_type)
);
CREATE INDEX IF NOT EXISTS idx_player_statistics_leaderboard ON player_statistics(game_type, wins DESC, win_rate DESC);
