-- ==============================================================================
-- GAMEVERSE: SEED DATA FOR LOCAL DEVELOPMENT & TESTING
-- File: supabase/seed.sql
-- ==============================================================================

-- 1. Insert Demo Telegram Group
INSERT INTO telegram_groups (id, telegram_chat_id, title, chat_type)
VALUES 
    ('11111111-1111-1111-1111-111111111111', -1001234567890, 'GameVerse Official Community', 'supergroup'),
    ('22222222-2222-2222-2222-222222222222', -1009876543210, 'Ludo & Uno Champs', 'group')
ON CONFLICT (telegram_chat_id) DO NOTHING;

-- 2. Insert Demo Profiles
INSERT INTO profiles (id, telegram_id, username, first_name, last_name, photo_url)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100000001, 'alex_gamer', 'Alex', 'Vance', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 100000002, 'sarah_p', 'Sarah', 'Connor', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 100000003, 'neo_matrix', 'Thomas', 'Anderson', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 100000004, 'elena_r', 'Elena', 'Rostova', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80')
ON CONFLICT (telegram_id) DO NOTHING;

-- 3. Insert Initial Player Statistics
INSERT INTO player_statistics (profile_id, game_type, matches_played, wins, losses)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'uno', 25, 18, 7),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ludo', 14, 9, 5),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'uno', 30, 21, 9),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ludo', 20, 15, 5),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'uno', 12, 6, 6),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ludo', 18, 11, 7),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'uno', 8, 3, 5),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ludo', 10, 4, 6)
ON CONFLICT (profile_id, game_type) DO NOTHING;
