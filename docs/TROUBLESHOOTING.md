# നേരംപോക്ക് (NERAMPOKKU) — TROUBLESHOOTING & FAQ

> **Official Name:** നേരംപോക്ക്  
> **Tagline:** കളിക്കാം... സമയം പോക്കാം!  
> **Descriptor:** GAME BOT  

### 1. Bot doesn't respond to `/games` in groups
- **Solution:** Group privacy mode is on by default in Telegram. In [@BotFather](https://t.me/BotFather), go to `/mybots` → Select your bot → **Bot Settings** → **Group Privacy** → **Turn off**. Then remove the bot from the group and re-add it.

### 2. Mini App fails with "Invalid Telegram authentication"
- **Solution:** Verify that the `TELEGRAM_BOT_TOKEN` in Supabase Secrets exactly matches the token provided by BotFather. Check if device system time is skewed by more than 24 hours.

### 3. Room shows "Room is full" when seats appear open
- **Solution:** Check `game_players` in Supabase Table Editor. Incomplete abandonments might hold seats; running `leave_game_session` cleans departed seats automatically.

### 4. Dice or Cards stutter or freeze
- **Solution:** Check WebSocket connection in browser network tab. Ensure Supabase Realtime replication is enabled on `game_states` and `game_sessions`.

### 5. Running locally without Telegram
- **Solution:** The app includes a built-in Developer Sandbox. When opened in a normal browser at `http://localhost:5173`, a sandbox bar appears allowing switching between mock players (Alex, Sarah, Thomas, Elena) for multi-window local testing without needing Telegram accounts!
