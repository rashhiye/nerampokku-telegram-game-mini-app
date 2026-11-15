# നേരംപോക്ക് (NERAMPOKKU) — SECURITY ARCHITECTURE & FRAUD PREVENTION

> **Official Name:** നേരംപോക്ക്  
> **Tagline:** കളിക്കാം... സമയം പോക്കാം!  
> **Descriptor:** GAME BOT  

## 1. Threat Model & Safeguards

| Threat Vector | Severity | Architectural Safeguard |
| :--- | :--- | :--- |
| **Telegram Identity Spoofing** | Critical | Server calculates `HMAC-SHA256` using Telegram Bot Token. Rejects any forged `initData`. User IDs are never accepted from client payloads. |
| **Tampered Game State / Cheating** | Critical | Game state mutations execute strictly on server via Edge Functions and stored procedures. Client acts strictly as input controller and display. |
| **Card Peeking / Wallhack** | High | In UNO, private hands are filtered server-side. The client payload contains only the requesting player's cards. Opponents receive only card counts. |
| **Dice / Card Predictability** | High | Shuffling and dice generation utilize cryptographically secure pseudo-random number generators (`crypto.getRandomValues`). |
| **Room Double-Occupancy / Race Conditions** | High | PostgreSQL `SELECT ... FOR UPDATE` acquires row-level locks on `game_sessions` before assigning seats. |
| **Turn Hijacking** | Medium | Moves require matching `expectedVersion` and verification that caller owns the active `current_turn_seat`. |
| **Secret Token Exposure** | Critical | `TELEGRAM_BOT_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` reside exclusively in server secrets. Only public `anon` key exists in frontend. |

---

## 2. Telegram HMAC-SHA256 Cryptographic Verification

According to [Telegram WebApp specifications](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
1. Client sends raw `initData` string.
2. Server extracts and strips `hash`.
3. Server checks `auth_date` ($\le 86,400\text{ seconds}$).
4. Server sorts remaining keys alphabetically and joins with `\n`.
5. Server derives secret key: `HMAC_SHA256("WebAppData", BOT_TOKEN)`.
6. Server computes `calculated_hash = HMAC_SHA256(secret_key, data_check_string)`.
7. Constant-time comparison ensures hash authenticity.
