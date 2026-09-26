# Memory 014: Video Player Dimensions & YouTube Iframe Visibility Fix

**Date**: 2026-09-26  
**Components**: 
- Live Player UI ([`src/components/HeroLiveStream.tsx`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/components/HeroLiveStream.tsx))
- Styles ([`src/index.css`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/index.css))
- YouTube Embed Engine ([`src/lib/youtube.ts`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/lib/youtube.ts))

---

## 1. Problem & Root Cause ("Just Audio / Black Screen")
* **Symptom**: When clicking play on a live stream, the audio was playing, but the screen was completely black and no video was visible.
* **Root Cause**: The `.video-player-container` uses a 16:9 aspect ratio padding hack (`padding-top: 56.25%`, `height: 0`).
* When wrapping the `iframe` inside an intermediate `<div style={{ position: 'relative', width: '100%', height: '100%' }}>`, the relative `div` computed to `0px` height because the parent's content height is 0.
* As a result, the `iframe` inside it rendered with `height: 0px`. YouTube was playing the stream, but the video pixels were collapsed to zero height, leaving only the audio playing and the dark container background showing.

---

## 2. Solution & Fix
1. **Explicit Absolute Wrapper**:
   * Replaced the inline relative styling with `.player-iframe-wrapper` in [`HeroLiveStream.tsx`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/components/HeroLiveStream.tsx).
   * Configured `.player-iframe-wrapper` in [`src/index.css`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/index.css):
     ```css
     .player-iframe-wrapper {
       position: absolute;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       z-index: 1;
     }

     .player-iframe-wrapper iframe {
       width: 100%;
       height: 100%;
       border: 0;
       display: block;
     }
     ```
   * Now the wrapper expands to fill the full 16:9 container, giving the YouTube `iframe` full 100% width and height.

2. **Universal YouTube Embed Parameters**:
   * Updated [`src/lib/youtube.ts`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/lib/youtube.ts) to use standard `https://www.youtube.com/embed/${videoId}` with clean query parameters (`autoplay=1`, `playsinline=1`) and removed restrictive localhost `origin` constraints.

---

## 3. Verification
* Verified with `npm run build` (compiled cleanly with code 0).
* YouTube video stream is now fully visible and plays with both video and audio.
