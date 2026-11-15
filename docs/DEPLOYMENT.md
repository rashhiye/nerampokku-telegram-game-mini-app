# നേരംപോക്ക് (NERAMPOKKU) — PRODUCTION DEPLOYMENT GUIDE

> **Official Name:** നേരംപോക്ക്  
> **Tagline:** കളിക്കാം... സമയം പോക്കാം!  
> **Descriptor:** GAME BOT  

## 1. Cloudflare Pages (Frontend)

1. Connect your GitHub repository to Cloudflare Pages.
2. Select root directory: `frontend`.
3. Set build command: `npm run build`.
4. Set output directory: `dist`.
5. Configure Environment Variables:
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOi...`
   - `VITE_TELEGRAM_BOT_USERNAME`: `NeramPokkuBot`
6. Deploy! Your app will be live at `https://nerampokku.pages.dev`.

---

## 2. Supabase (Database & Edge Functions)

1. Apply migrations:
   ```bash
   supabase db push
   ```
   Or paste `supabase/migrations/*.sql` into Supabase SQL Editor.
2. Set backend secrets:
   ```bash
   supabase secrets set TELEGRAM_BOT_TOKEN="your-bot-token"
   supabase secrets set TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"
   supabase secrets set VITE_TELEGRAM_BOT_USERNAME="YourBotUsername"
   ```
3. Deploy functions:
   ```bash
   supabase functions deploy auth-verify
   supabase functions deploy telegram-bot
   supabase functions deploy session-manager
   supabase functions deploy game-action
   ```

---

## 3. Telegram Bot Webhook Registration

Register your Supabase function as the webhook for Telegram:
```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot<TOKEN>/setWebhook" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{ url = "https://<PROJECT_REF>.supabase.co/functions/v1/telegram-bot"; secret_token = "<SECRET>" } | ConvertTo-Json)
```
