# Memory 013: Poster Preview Mode & Telegram Bot Interactive Workflow Enhancements

**Date**: 2026-09-26  
**Components**: 
- Live Player UI ([`src/components/HeroLiveStream.tsx`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/components/HeroLiveStream.tsx))
- Styles ([`src/index.css`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/index.css))
- YouTube Embed Engine ([`src/lib/youtube.ts`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/lib/youtube.ts))
- Realtime Stream Sync ([`src/lib/streamService.ts`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/lib/streamService.ts), [`src/App.tsx`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/App.tsx))
- Telegram Admin Bot ([`server/telegram-bot.js`](file:///c:/Users/user/Desktop/be_fortified%20christains/server/telegram-bot.js))

---

## 1. Context & User Directives
1. **YouTube Embed Error Resolution ("An error occurred. Please try again later.")**:
   - Instead of immediately loading a raw iframe that can show an initial black screen or playback restriction error, show the high-resolution service flyer / thumbnail first.
   - Embed is upgraded to `youtube-nocookie.com` with `origin` and privacy headers.
   - Display a prominent, pulsing gold "Click to Watch Live Broadcast" play button overlay.
   - Clicking play dynamically mounts the iframe with `autoplay: true`.
   - Provide an optional "Open on YouTube" external link fallback for native app playback.
2. **Telegram Bot "🔴 Go Live Now" Flow**:
   - When clicked, prompt immediately: *"Please paste your YouTube Live Stream URL"*.
   - As soon as URL is sent, immediately broadcast live to the website.
   - Then offer an optional step: *"Send a flyer photo from phone gallery or paste an image URL"*.
   - Then offer an optional step: *"Enter Bible reading / scripture"*.
3. **Telegram Bot "⏹️ Stop Broadcast" Flow**:
   - Check active live stream.
   - Prompt admin: *"Do you want this service saved to Previous Recorded Videos? Tap 'Save Live Video as Recorded', paste a new recorded YouTube URL, or tap 'Skip / Do Not Archive'"*.
   - Updates Supabase `status: 'ended'` accordingly.
4. **Telegram Bot "📅 Schedule Stream" Flow**:
   - Asks for title, YouTube URL, flyer image upload, and scheduled service time.
5. **Realtime WebSocket Sync**:
   - `StreamService.subscribeToStreams()` connects the website to Supabase PostgreSQL changes, updating the live stream immediately without needing to refresh the page.

---

## 2. Verification
- Fixed missing `formatStreamDate` import in `HeroLiveStream.tsx`.
- Successfully compiled production bundle with `npm run build` (code 0 in 2.04s).
- Verified `server/telegram-bot.js` polling with Supabase connected.
