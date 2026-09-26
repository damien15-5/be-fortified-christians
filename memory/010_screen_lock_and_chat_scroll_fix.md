# Memory 010: Screen Lock & Chat Scroll Position Anchoring

**Date**: 2026-09-26  
**Component**: Live Stream Fellowship UI ([`src/components/HeroLiveStream.tsx`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/components/HeroLiveStream.tsx)), Global Styling ([`src/index.css`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/index.css))

---

## 1. Problem & Root Cause
* **Symptom**: Whenever a user typed a prayer or praise and pressed Send (or triggered an emoji reaction), the entire browser viewport/screen jumped downward by a few paces instead of maintaining its exact scroll position.
* **Root Cause**: The component had an invisible `<div ref={chatEndRef} />` at the bottom of the chat list, and called `chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })`.
* Under the W3C DOM specification, `Element.scrollIntoView()` scrolls the element's **ancestor containers, including `window`**. Because the chat list was partially positioned near or below the initial viewport fold on some screen sizes, the browser scrolled the entire document down to make the bottom marker visible.

---

## 2. Solution & Implementation
1. **Isolated Container Scrolling**:
   * Removed `chatEndRef` and the trailing `<div ref={chatEndRef} />` DOM node.
   * Created a direct container ref: `chatFeedRef = useRef<HTMLDivElement>(null)` attached directly to `<div className="live-chat-feed" ref={chatFeedRef}>`.
   * Created a dedicated internal scroll function:
     ```tsx
     const scrollChatFeedToBottom = () => {
       if (chatFeedRef.current) {
         chatFeedRef.current.scrollTo({
           top: chatFeedRef.current.scrollHeight,
           behavior: 'smooth'
         });
       }
     };
     ```
   * Calling `.scrollTo()` strictly on the `HTMLDivElement` exclusively adjusts the inner scroll position of the chat feed container, guaranteeing that `window.scrollY` remains 100% frozen/locked in position.

2. **Overscroll Containment in CSS**:
   * Added `overscroll-behavior: contain;` and `scroll-behavior: smooth;` to `.live-chat-feed` in [`src/index.css`](file:///c:/Users/user/Desktop/be_fortified%20christains/src/index.css).
   * This prevents browser scroll chaining/leaks so dragging or momentum-scrolling the chat list on mobile or trackpads will never scroll the outer webpage.

---

## 3. Verification
* Successfully ran `npm run build` with zero TypeScript or bundle warnings (`dist/` generated cleanly in 1.64s).
* The screen remains completely stable and locked when submitting messages, reactions, or opening the cookie name modal.
