# Memory 016: Removal of Floating Player Action Buttons

**Date**: 2026-09-26  
**Component**: Live Stream Player UI ([`src/components/HeroLiveStream.tsx`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/components/HeroLiveStream.tsx))

---

## 1. Overview & User Directives
The user requested:
> "remove those things" with screenshot showing the floating `Open on YouTube` and `Show Flyer` buttons overlaying the video player.

## 2. Implementation
- Removed `.player-floating-actions` from [`HeroLiveStream.tsx`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/components/HeroLiveStream.tsx) (`Open on YouTube` pill and `🖼️ Show Flyer` pill).
- Removed the `Watch directly on YouTube` link from the poster preview overlay.
- Cleaned up unused `ExternalLink` icon imports.
- The video player now runs in a completely clean, unencumbered state without any floating UI elements covering the stream.

## 3. Verification
- Production build passes cleanly (`tsc -b && vite build` exited with code 0).
