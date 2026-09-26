# Be Fortified Christians Network 🏰
> **Official Live Streaming Sanctuary & Interactive Ministry Platform**  
> *"Befortified in your mind • Befortified in your resolve • Befortified in your position"*

---

## 🌟 Overview

**Be Fortified Christians Network** is a modern church live streaming and ministry platform. Built with a rich royal blue, white, and gold design system, the platform features:

- 🔴 **Live Sanctuary Streaming**: Seamless YouTube Live embed with dynamic 16:9 scaling and dual Fullscreen / Cinema Mode.
- 💬 **Interactive Live Fellowship**: Non-blocking real-time chat with cookies-based user naming, animated floating praise reactions (❤️, 🙏, 🔥, 🙌, ✝️), and automated prayer wall submission.
- 🤖 **Telegram Bot CMS (`@BE_FORTIFIED_CHRISTIANS_bot`)**: Complete, 24/7 mobile administration without any frontend web admin exposure. Church media team can:
  - Go live in 1 tap (`🔴 Quick Go Live`)
  - Change stream links on the fly (`🔗 Change Live Link`)
  - Update sermon title and live scripture readings
  - Schedule upcoming services with custom flyer uploads
  - Archive/stop broadcasts
- ⚡ **Supabase PostgreSQL & Realtime**: Instant synchronization across all connected web viewers whenever the media team takes an action on Telegram.
- 💳 **Kingdom Giving**: Direct support accounts (Moniepoint MFB: `3003396337` — Befortified Projects Services).
- 📜 **Prayer Wall & Schedule**: Interactive prayer request system and automated countdown timers to weekly Sunday services (2:00 PM GMT+1 with Pastor John Jibril).

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+
- npm or yarn

### 2. Installation
```bash
git clone https://github.com/damien15-5/be-fortified-christians.git
cd be-fortified-christians
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase & Telegram credentials:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Public Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (for Telegram Bot) |
| `TELEGRAM_BOT_TOKEN` | Token from [@BotFather](https://t.me/Botfather) |
| `ADMIN_TELEGRAM_IDS` | (Optional) Comma-separated Telegram User IDs for access control |

### 4. Run Locally
- **Frontend Web Sanctuary**:
  ```bash
  npm run dev
  ```
  Open `http://localhost:5173/` in your browser.

- **Telegram Admin Bot**:
  ```bash
  npm run bot
  ```

- **Production Build Check**:
  ```bash
  npm run build
  ```

---

## 🌐 Deployment Guide

### A. Deploying the Frontend (Vercel / Netlify)

#### Option 1: Vercel (Recommended)
1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `damien15-5/be-fortified-christians` repository.
4. Set the Build Command to `npm run build` and Output Directory to `dist`.
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy**. SPA routing rewrites are pre-configured in `vercel.json`.

#### Option 2: Netlify
1. Connect repository on [Netlify](https://www.netlify.com/).
2. Set Build Command: `npm run build`, Publish Directory: `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Environment Variables.
4. Deploy. Pre-configured `netlify.toml` handles routing redirects.

---

### B. Deploying the Telegram Bot (24/7 Cloud Background Worker)

The Telegram bot acts as the church's mobile CMS and runs 24/7.

#### Option 1: Render.com (Background Worker)
1. In [Render Dashboard](https://dashboard.render.com/), click **New +** -> **Background Worker**.
2. Connect `damien15-5/be-fortified-christians`.
3. Runtime: **Node**.
4. Build Command: `npm install`.
5. Start Command: `npm run bot` (or `node server/telegram-bot.js`).
6. Add Environment Variables:
   - `TELEGRAM_BOT_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_TELEGRAM_IDS` (optional)
7. Save and deploy!

#### Option 2: Railway.app / Heroku / VPS (PM2)
- With `Procfile` included, Railway and Heroku automatically detect the `worker` process.
- On a Linux VPS with PM2:
  ```bash
  npm install -g pm2
  pm2 start server/telegram-bot.js --name "bf-telegram-bot"
  pm2 save
  pm2 startup
  ```

---

## 🗄️ Database Architecture (Supabase SQL)

The PostgreSQL database schema with real-time replication and atomic stored procedures is located in [`TELEGRAM_AND_SUPABASE_SETUP.md`](./TELEGRAM_AND_SUPABASE_SETUP.md) and [`supabase/`](./supabase).

Key tables:
- `streams`: Broadcasts, YouTube video IDs, status (`live`, `upcoming`, `ended`), flyer thumbnails, scriptures, viewer counts.
- `prayer_requests`: Live prayer requests and testimonies synced with fellowship chat.

---

## 📱 Telegram Admin Commands Reference

| Command / Action | Description |
|---|---|
| `🔴 Quick Go Live` | Prompts for YouTube URL/ID and activates live broadcast instantly |
| `🔗 Change Live Link` | Updates the active live broadcast YouTube link without restarting |
| `⏹️ Stop Live Broadcast` | Archives the current broadcast with choice to save recording |
| `📅 Schedule Service` | 4-step wizard to schedule upcoming service with flyer upload |
| `📖 Update Scripture` | Changes the Bible reading banner on the live player |
| `📝 Update Title` | Renames the current stream title |
| `🔴 View Active Live Stream` | Shows live broadcast details, YouTube link, and viewer stats |

---

## 🛡️ License

Private repository for Be Fortified Christians Network. All rights reserved.
