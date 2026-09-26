# Memory 019: Mobile Layout Optimization, Exact Realtime Viewers, Universal Chat, Minister Selection & Keep-Alive

## Date: 2026-09-27

### 1. Mobile Player Layout & Poster Fix
- **Collapsing Top Bar**: Fixed mobile badge overflow (`● LIVE STR [Share] [Fullscreen] hing`). Added `.live-badge-short` (`● LIVE` on mobile `<= 520px`), compact spacing, and `.btn-text-mobile-hide` so Share and Fullscreen buttons fit cleanly side-by-side with viewer counter.
- **Unblocked Flyer Poster**: Removed giant `.poster-title-text` overlay that obscured Pastor John Jibril's face and event details. Replaced with subtle vignette (`0.42` tint) and center glowing play pulse button with compact pill.

### 2. Exact Realtime Viewers & Universal Fellowship
- **Supabase Realtime Presence**: Replaced static viewer counts with live channel presence (`channel.on('presence')`). Automatically updates `activeViewers` count as users join and leave.
- **Universal Fellowship Broadcast**: Chat messages and animated praise reactions broadcast across all connected browsers globally via Supabase Realtime broadcast channels.
- **Live Prayer Requests**: Stored in and subscribed to Supabase `prayer_requests` PostgreSQL table.

### 3. Minister / Pastor Selection (Telegram CMS & Website)
- **Universal Minister Selector**: Added `👤 Set Minister / Pastor`, `/pastor`, and `/minister` commands in `server/telegram-bot.js`.
- **Integrated Across Flows**: Quick Live (Step 4), Schedule Stream (Step 4), and on-demand live stream switcher allow assigning Lead Pastor, Resident Pastor, Guest Speaker, or any custom minister.
- **Website Rendering**: Live stream player displays `speaker` and `speaker_title` dynamically.

### 4. Supabase Keep-Alive Heartbeat & 3-Day Reminders
- **24-Hour Heartbeat**: Telegram bot pings Supabase PostgreSQL every 24 hours to prevent free-tier project pausing.
- **3-Day Broadcast Check**: Proactive Telegram notifications sent to church admins asking if a service is live or upcoming with 1-click action buttons.
- **GitHub Actions Workflow**: `.github/workflows/supabase-keepalive.yml` added for redundant cloud cron pinging every 3 days.
