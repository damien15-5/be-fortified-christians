# 🏰 Be Fortified Christians — Telegram Admin Bot & Supabase Setup Guide ("The Receipts")

This document provides complete, copy-paste instructions and configuration "receipts" to connect your **Supabase PostgreSQL Database** and your **Telegram Admin Bot** to power the **Be Fortified Christians** live streaming website.

---

## 🏗️ Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │          CHURCH ADMIN(S)             │
                      │        (Mobile / Desktop App)        │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    TELEGRAM ADMIN BOT (CMS)          │
                      │  • /quicklive <url> <title>          │
                      │  • /schedule <url> <title>           │
                      │  • /live, /stop, /streams            │
                      └─────────────┬──────────┬─────────────┘
                                    │          │
                 Webhook Mode       │          │ Long Polling Mode
           ┌────────────────────────┘          └────────────────────────┐
           ▼                                                            ▼
┌───────────────────────────────┐                    ┌───────────────────────────────┐
│     SUPABASE EDGE FUNCTION    │                    │     NODE.JS LOCAL / VPS BOT   │
│  /functions/v1/telegram-webhook │                  │      (npm run bot)            │
└──────────────┬────────────────┘                    └──────────────┬────────────────┘
               │                                                    │
               └──────────────────────┬─────────────────────────────┘
                                      │
                                      ▼
                      ┌──────────────────────────────────────┐
                      │       SUPABASE POSTGRESQL DB         │
                      │  • public.streams                    │
                      │  • public.prayer_requests            │
                      │  • Atomic RPC: set_stream_live()     │
                      └──────────────────┬───────────────────┘
                                         │ Realtime & REST API
                                         ▼
                      ┌──────────────────────────────────────┐
                      │   BE FORTIFIED CHRISTIANS WEBSITE    │
                      │      (http://localhost:5173)         │
                      │  • 16:9 YouTube Cinema Player        │
                      │  • Live Status & Reactions           │
                      │  • Upcoming & Previous Archives      │
                      └──────────────────────────────────────┘
```

---

## 🧾 RECEIPT 1: Telegram BotFather Configuration

Follow these exact steps to create and configure your bot in under 3 minutes:

### 1. Open BotFather
1. Open Telegram on your phone or computer.
2. Search for `@BotFather` (verified blue checkmark) or visit [https://t.me/BotFather](https://t.me/BotFather).
3. Tap **Start**.

### 2. Create the Bot
Send:
```text
/newbot
```
BotFather will ask for a **Name**. Enter:
```text
Be Fortified Christians Admin
```
BotFather will ask for a **Username** (must end in `bot`). Enter something like:
```text
befortified_admin_bot
```
*(If taken, try `befortified_stream_bot` or `befortified_live_bot`).*

### 3. Copy Your Bot Token
BotFather will respond with your **HTTP API Token**:
```text
Use this token to access the HTTP API:
7812345678:AAHxy78AbCdEfGhIjKlMnOpQrStUvWxYz
```
👉 Copy this token and paste it into your `.env` file as:
```env
TELEGRAM_BOT_TOKEN=7812345678:AAHxy78AbCdEfGhIjKlMnOpQrStUvWxYz
```

### 4. Configure Bot Commands (Copy & Paste)
Send to @BotFather:
```text
/setcommands
```
Select your bot, then copy and paste this **exact block**:
```text
quicklive - Instantly broadcast YouTube stream to website
schedule - Add upcoming service to schedule list
live - Check currently active live stream on website
stop - End active live broadcast and archive to previous
streams - View list of all streams and switch live status
newstream - Interactive wizard to schedule or publish stream
delete - Delete a stream by ID
help - View all available admin commands and guidance
```

### 5. Set Bot Description & Profile
Send to @BotFather:
```text
/setdescription
```
Select your bot, then paste:
```text
Official administrative content management bot for the Be Fortified Christians streaming platform. Use this bot to launch live YouTube streams, schedule services, and archive past broadcasts.
```

### 6. Protect Your Bot (Admin Whitelist)
To ensure only you and authorized church leaders can control the broadcast:
1. Search for `@userinfobot` on Telegram and send `/start`.
2. It will output your numeric Telegram ID (e.g. `123456789`).
3. Add this ID to `.env`:
```env
ADMIN_TELEGRAM_IDS=123456789
```
*(If multiple admins need access, separate IDs with commas: `ADMIN_TELEGRAM_IDS=123456789,987654321`)*

---

## 🧾 RECEIPT 2: Supabase Database Setup

### 1. Log in to Supabase
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Create a new project named `be-fortified-christians` (or choose your existing project).

### 2. Run Database Schema
1. In the left sidebar of your Supabase dashboard, click **SQL Editor**.
2. Click **+ New Query**.
3. Open the file [`supabase/schema.sql`](file:///c:/Users/user/Desktop/be_fortified%20christains/supabase/schema.sql) from this project.
4. Copy its entire content and paste it into the Supabase SQL Editor.
5. Click **Run** (or `Ctrl+Enter`).
6. You should see `Success. No rows returned`.
   - ✅ Tables created: `public.streams`, `public.prayer_requests`
   - ✅ Row Level Security (RLS) policies configured
   - ✅ Stored procedures created: `set_stream_live()`, `end_active_stream()`
   - ✅ Seed data added with Pastor John Jibril and Sunday Special details

### 3. Copy API Keys
1. In the Supabase left sidebar, click the **Settings (Gear Icon)** -> **API**.
2. Copy these 3 credentials into your `.env` file:
   - **Project URL** ➔ `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public key** ➔ `VITE_SUPABASE_ANON_KEY`
   - **service_role secret key** ➔ `SUPABASE_SERVICE_ROLE_KEY`

---

## 🧾 RECEIPT 3: Your `.env` Configuration File

Your `.env` file in the root directory should look like this:

```env
# 1. Supabase Cloud Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Telegram Admin Bot Token (From @BotFather)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# 3. Authorized Admin Telegram User IDs (From @userinfobot)
ADMIN_TELEGRAM_IDS=123456789
```

---

## 🚀 How to Run the Bot

You have two easy ways to run the Telegram Bot:

### Method A: Local / Server Long Polling (Fastest & Simplest)
Run directly on your computer or a virtual machine:
```bash
npm run bot
```
The terminal will display:
```
🏰 BE FORTIFIED CHRISTIANS — TELEGRAM ADMIN BOT
✅ Telegram Bot Token configured.
✅ Supabase PostgreSQL connected.
🤖 Telegram Admin Bot is polling and ready for commands!
```
Now open your bot in Telegram and send `/start` or click the menu buttons!

---

### Method B: Supabase Edge Function (Serverless 24/7, No Server Needed!)

You can run the bot 100% serverlessly using Supabase Edge Functions:

1. The function is already created at [`supabase/functions/telegram-webhook/index.ts`](file:///c:/Users/user/Desktop/be_fortified%20christains/supabase/functions/telegram-webhook/index.ts).
2. Deploy the function via Supabase CLI:
   ```bash
   npx supabase functions deploy telegram-webhook --no-verify-jwt
   ```
3. Set your Edge Function secrets in Supabase Dashboard (or via CLI):
   ```bash
   npx supabase secrets set TELEGRAM_BOT_TOKEN=your_token ADMIN_TELEGRAM_IDS=your_id
   ```
4. Register the webhook with Telegram by opening this URL in any browser:
   ```text
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/telegram-webhook
   ```
   Telegram will reply:
   ```json
   {"ok": true, "result": true, "description": "Webhook was set"}
   ```
From this point forward, your bot runs 24/7 on Supabase with zero server maintenance.

---

## 📱 Telegram Command Reference Card

| Command | Action | Example |
|---|---|---|
| `🔴 Go Live Now` / `/quicklive <URL> <Title>` | Instantly stream YouTube video live to website hero cinema | `/quicklive https://youtu.be/kJQP7kiw5Fk Sunday Special Service` |
| `📅 Schedule Stream` / `/schedule <URL> <Title>` | Add upcoming stream to church schedule | `/schedule https://youtu.be/fJ9rUzIMcZQ Next Sunday Service` |
| `📊 Current Status` / `/live` | View what is currently streaming on the website | `/live` |
| `⏹️ Stop Broadcast` / `/stop` | End live broadcast & automatically archive to Previous Videos | `/stop` |
| `📋 All Streams` / `/streams` | View stream library & click inline buttons to promote any stream to live | `/streams` |
| `/delete <stream_id>` | Permanently remove a stream from the database | `/delete stream-123` |
| `❓ Help & Commands` / `/help` | Display quick commands and admin user ID | `/help` |
