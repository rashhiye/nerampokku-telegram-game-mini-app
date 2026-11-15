# നേരംപോക്ക് (NERAMPOKKU) — API & EDGE FUNCTION REFERENCE

> **Official Name:** നേരംപോക്ക്  
> **Tagline:** കളിക്കാം... സമയം പോക്കാം!  
> **Descriptor:** GAME BOT  

All API endpoints are implemented as serverless **Supabase Edge Functions** (Deno) with CORS headers enabled.

---

## 1. Authentication: `POST /functions/v1/auth-verify`

Validates Telegram Mini App `initData` and returns verified profile.

### Headers
```http
Content-Type: application/json
```

### Request Body
```json
{
  "initDataRaw": "query_id=AAH...&user=%7B%22id%22%3A100000001%2C%22first_name%22%3A%22Alex%22...%7D&auth_date=1710000000&hash=abc123def..."
}
```

### Response (200 OK)
```json
{
  "success": true,
  "profile": {
    "id": "a90714c5-5555-4444-3333-222211110000",
    "telegram_id": 100000001,
    "first_name": "Alex",
    "last_name": "Vance",
    "username": "alex_gamer",
    "photo_url": "https://images.unsplash.com/photo-..."
  },
  "telegramContext": {
    "chat_type": "supergroup",
    "chat_instance": "-1001234567890",
    "start_param": "g_-1001234567890"
  }
}
```

---

## 2. Session Management: `POST /functions/v1/session-manager`

Creates, joins, leaves, or starts multiplayer game sessions.

### Request Body: Create Room
```json
{
  "action": "create_room",
  "profileId": "a90714c5-...",
  "payload": {
    "groupId": "11111111-1111-1111-1111-111111111111",
    "gameType": "uno",
    "maxPlayers": 4,
    "settings": {
      "turnTimer": 30,
      "allowStackingDraw2": false,
      "allowStackingDraw4": false,
      "wildChallengeEnabled": true
    }
  }
}
```

### Request Body: Join Room
```json
{
  "action": "join_room",
  "profileId": "a90714c5-...",
  "payload": {
    "sessionId": "session-uuid-here"
  }
}
```

### Response: Join Room (200 OK)
```json
{
  "success": true,
  "session_id": "session-uuid-here",
  "seat_index": 2,
  "player_count": 3,
  "is_host": false
}
```

---

## 3. Authoritative Gameplay: `POST /functions/v1/game-action`

Submits an in-game move or turn action.

### Request Body
```json
{
  "sessionId": "session-uuid-here",
  "profileId": "a90714c5-...",
  "gameType": "uno",
  "expectedVersion": 12,
  "action": {
    "type": "PLAY_CARD",
    "seat": 0,
    "cardId": "c_24",
    "chosenColor": "blue"
  }
}
```

### Response (200 OK)
```json
{
  "success": true,
  "version": 13,
  "state": {
    "version": 13,
    "current_turn_seat": 1,
    "turn_direction": 1,
    "turn_deadline": "2026-11-15T09:30:00Z",
    "public_state": { ... },
    "winner_seat": null
  }
}
```

---

## 4. Telegram Bot Webhook: `POST /functions/v1/telegram-bot`

Handles incoming Telegram Bot webhook updates.
- **Secret Header:** `X-Telegram-Bot-Api-Secret-Token`
- **Supported Commands:** `/start`, `/games`, `/help`, `/profile`, `/stats`.
