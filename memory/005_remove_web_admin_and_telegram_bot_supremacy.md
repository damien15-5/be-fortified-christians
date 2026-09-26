# Memory 005: Total Removal of Web Admin & Dedicated Telegram Bot Admin Architecture

## Objectives & User Decisions
1. **Total Removal of Web Admin**:
   - User directive: *"Delete that admin page stuff from that website totally. The Telegram bot will be the main admin page, it's the main admin portal."*
   - Removed `AdminPortal.tsx` and `TelegramBotGuide.tsx` from the frontend website.
   - Removed all Admin links from `Navbar.tsx`, `Footer.tsx`, and `App.tsx`.
   - The public website is now a pure viewer streaming sanctuary (Home, Watch Live, Upcoming, Previous Videos, Prayer, Giving).

2. **Telegram Bot as the Primary CMS**:
   - Upgraded `server/telegram-bot.js` into an admin command center with rich inline keyboard menus, stream scheduling wizards, instant `/quicklive`, status toggling, and Supabase database sync.
   - Provided comprehensive setup instructions (`TELEGRAM_BOT_SETUP_GUIDE.md`) covering BotFather setup, admin ID authorization, and deployment options (Local Daemon, VPS, or Supabase Edge Functions).

3. **Supabase Edge Function & SQL Stored Procedures**:
   - Provided complete PostgreSQL schema in `supabase/schema.sql` with atomic stored procedures: `set_stream_live(target_id)` and `end_active_stream()`.
   - Created Supabase Edge Function (`supabase/functions/telegram-webhook/index.ts`) for serverless Telegram webhook operation directly inside Supabase with zero server hosting costs.
