-- ==============================================================================
-- GAMEVERSE: STORED PROCEDURES & ATOMIC RPCS
-- Migration: 20261115000002_functions_and_rpcs.sql
-- ==============================================================================

-- 1. ATOMIC JOIN ROOM RPC
CREATE OR REPLACE FUNCTION join_game_session(
    p_session_id UUID,
    p_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_seat_index INT;
    v_player_count INT;
    v_existing_seat INT;
BEGIN
    -- Acquire exclusive row lock on the session to eliminate race conditions
    SELECT * INTO v_session
    FROM game_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND', 'message', 'Game session not found.');
    END IF;

    IF v_session.status != 'waiting' THEN
        RETURN jsonb_build_object('success', false, 'error', 'GAME_ALREADY_STARTED', 'message', 'Cannot join a game that has already started or completed.');
    END IF;

    -- Check if already joined (re-entry)
    SELECT seat_index INTO v_existing_seat
    FROM game_players
    WHERE session_id = p_session_id AND profile_id = p_profile_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Already joined session',
            'session_id', p_session_id,
            'seat_index', v_existing_seat,
            'is_host', (v_session.host_id = p_profile_id)
        );
    END IF;

    -- Check capacity
    SELECT COUNT(*) INTO v_player_count
    FROM game_players
    WHERE session_id = p_session_id;

    IF v_player_count >= v_session.max_players THEN
        RETURN jsonb_build_object('success', false, 'error', 'ROOM_FULL', 'message', 'Room has reached maximum capacity.');
    END IF;

    -- Find lowest available seat index (0 to max_players - 1)
    SELECT s.seat INTO v_seat_index
    FROM generate_series(0, v_session.max_players - 1) AS s(seat)
    WHERE s.seat NOT IN (
        SELECT seat_index FROM game_players WHERE session_id = p_session_id
    )
    ORDER BY s.seat ASC
    LIMIT 1;

    -- Insert player
    INSERT INTO game_players (session_id, profile_id, seat_index, status)
    VALUES (p_session_id, p_profile_id, v_seat_index, 'waiting');

    -- Update session player count
    UPDATE game_sessions
    SET current_player_count = v_player_count + 1
    WHERE id = p_session_id;

    -- Emit room event
    INSERT INTO game_events (session_id, event_seq, event_type, actor_id, payload)
    VALUES (
        p_session_id,
        COALESCE((SELECT MAX(event_seq) FROM game_events WHERE session_id = p_session_id), 0) + 1,
        'PLAYER_JOINED',
        p_profile_id,
        jsonb_build_object('seat_index', v_seat_index, 'player_count', v_player_count + 1)
    );

    RETURN jsonb_build_object(
        'success', true,
        'session_id', p_session_id,
        'seat_index', v_seat_index,
        'player_count', v_player_count + 1,
        'is_host', (v_session.host_id = p_profile_id)
    );
END;
$$;

-- 2. LEAVE ROOM RPC
CREATE OR REPLACE FUNCTION leave_game_session(
    p_session_id UUID,
    p_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_player_count INT;
    v_new_host_id UUID;
BEGIN
    SELECT * INTO v_session
    FROM game_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND');
    END IF;

    -- Remove player from room
    DELETE FROM game_players
    WHERE session_id = p_session_id AND profile_id = p_profile_id;

    -- Recount remaining players
    SELECT COUNT(*) INTO v_player_count
    FROM game_players
    WHERE session_id = p_session_id;

    -- If room is now empty, delete or abandon it
    IF v_player_count = 0 THEN
        UPDATE game_sessions
        SET status = 'abandoned', ended_at = NOW()
        WHERE id = p_session_id;
        RETURN jsonb_build_object('success', true, 'room_dissolved', true);
    END IF;

    -- If the departing player was host, assign host to the oldest joined player
    IF v_session.host_id = p_profile_id THEN
        SELECT profile_id INTO v_new_host_id
        FROM game_players
        WHERE session_id = p_session_id
        ORDER BY joined_at ASC
        LIMIT 1;

        UPDATE game_sessions
        SET host_id = v_new_host_id, current_player_count = v_player_count
        WHERE id = p_session_id;
    ELSE
        UPDATE game_sessions
        SET current_player_count = v_player_count
        WHERE id = p_session_id;
    END IF;

    -- Emit room event
    INSERT INTO game_events (session_id, event_seq, event_type, actor_id, payload)
    VALUES (
        p_session_id,
        COALESCE((SELECT MAX(event_seq) FROM game_events WHERE session_id = p_session_id), 0) + 1,
        'PLAYER_LEFT',
        p_profile_id,
        jsonb_build_object('new_host_id', v_new_host_id, 'player_count', v_player_count)
    );

    RETURN jsonb_build_object('success', true, 'new_host_id', v_new_host_id, 'player_count', v_player_count);
END;
$$;

-- 3. START ROOM RPC
CREATE OR REPLACE FUNCTION start_game_session(
    p_session_id UUID,
    p_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_player_count INT;
BEGIN
    SELECT * INTO v_session
    FROM game_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND');
    END IF;

    -- Only host can manually trigger start
    IF v_session.host_id != p_profile_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_HOST', 'message', 'Only the match host can start the game.');
    END IF;

    IF v_session.status != 'waiting' THEN
        RETURN jsonb_build_object('success', false, 'error', 'ALREADY_STARTED');
    END IF;

    SELECT COUNT(*) INTO v_player_count
    FROM game_players
    WHERE session_id = p_session_id;

    IF v_player_count < v_session.min_players THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_ENOUGH_PLAYERS',
            'message', format('Need at least %s players to start.', v_session.min_players)
        );
    END IF;

    -- Mark session as in_progress
    UPDATE game_sessions
    SET status = 'in_progress', started_at = NOW()
    WHERE id = p_session_id;

    -- Update all players to 'playing'
    UPDATE game_players
    SET status = 'playing'
    WHERE session_id = p_session_id;

    -- Emit event
    INSERT INTO game_events (session_id, event_seq, event_type, actor_id, payload)
    VALUES (
        p_session_id,
        COALESCE((SELECT MAX(event_seq) FROM game_events WHERE session_id = p_session_id), 0) + 1,
        'GAME_STARTED',
        p_profile_id,
        jsonb_build_object('started_at', NOW(), 'player_count', v_player_count)
    );

    RETURN jsonb_build_object('success', true, 'session_id', p_session_id, 'status', 'in_progress');
END;
$$;

-- 4. RECORD MATCH RESULT & UPDATE STATS
CREATE OR REPLACE FUNCTION record_match_result(
    p_session_id UUID,
    p_winner_profile_id UUID,
    p_game_type game_type_enum
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player RECORD;
BEGIN
    -- Mark session completed
    UPDATE game_sessions
    SET status = 'completed', ended_at = NOW()
    WHERE id = p_session_id;

    -- Iterate through all participants and update their stats
    FOR v_player IN (SELECT profile_id FROM game_players WHERE session_id = p_session_id) LOOP
        -- Upsert stats
        INSERT INTO player_statistics (profile_id, game_type, matches_played, wins, losses)
        VALUES (
            v_player.profile_id,
            p_game_type,
            1,
            CASE WHEN v_player.profile_id = p_winner_profile_id THEN 1 ELSE 0 END,
            CASE WHEN v_player.profile_id = p_winner_profile_id THEN 0 ELSE 1 END
        )
        ON CONFLICT (profile_id, game_type)
        DO UPDATE SET
            matches_played = player_statistics.matches_played + 1,
            wins = player_statistics.wins + (CASE WHEN v_player.profile_id = p_winner_profile_id THEN 1 ELSE 0 END),
            losses = player_statistics.losses + (CASE WHEN v_player.profile_id = p_winner_profile_id THEN 0 ELSE 1 END),
            updated_at = NOW();
    END LOOP;

    RETURN jsonb_build_object('success', true, 'session_id', p_session_id, 'winner_id', p_winner_profile_id);
END;
$$;
