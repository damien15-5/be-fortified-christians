# Memory 015: View Active Live Stream & Change Link Action

**Date**: 2026-09-26  
**Component**: Telegram Admin Bot ([`server/telegram-bot.js`](file:///c:/Users/user/Desktop/be_fortified%20christains/server/telegram-bot.js))

---

## 1. Overview & User Directives
The user requested:
> "add an action where they can see current live stream and change link, like a button showing live stream"

## 2. Implementation
1. **Interactive Keyboard Update**:
   - Added **`🔴 View Active Live Stream`** button: shows full live stream metadata, speaker, scripture, view count, and current YouTube URL.
   - Added **`🔗 Change Live Link`** button: directly prompts for a new YouTube live stream URL to switch viewers to.
2. **Inline Action Buttons on Live Card**:
   - When viewing the active live stream (via `🔴 View Active Live Stream`, `📊 Current Status`, or `/live`), the bot renders interactive inline buttons:
     - `[🔗 Change Live Link]` -> triggers URL prompt
     - `[📖 Edit Scripture]` -> triggers Bible passage prompt
     - `[📝 Edit Title]` -> triggers Title prompt
     - `[⏹️ Stop Broadcast]` -> ends and archives stream
3. **Change Link Flow**:
   - Supports both conversational prompting (tap button -> bot asks for URL -> paste URL) and direct command (`/changelink <url>`).
   - Automatically parses video ID and updates Supabase `streams` record (`youtube_url`, `youtube_video_id`, `updated_at`).
   - Website clients receive the change via Supabase Realtime WebSocket and switch video streams immediately.
4. **Command Autocomplete**:
   - Updated Telegram Bot commands via `setMyCommands` to register `/live`, `/changelink`, `/quicklive`, `/scripture`, `/title`, `/stop`, `/newstream`, `/streams`.
