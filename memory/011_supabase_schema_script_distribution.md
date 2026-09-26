# Memory 011: Supabase Database Schema Script

**Date**: 2026-09-26  
**Component**: Database Infrastructure ([`supabase/schema.sql`](file:///c:/Users/user/Desktop/be_fortified%20christains/supabase/schema.sql))

---

## 1. Overview
Delivered complete, idempotent SQL setup script for Supabase PostgreSQL.

## 2. Contents of Schema
1. **`public.streams` Table**: ID, title, description, YouTube URL, video ID, speaker, status (`upcoming`, `live`, `ended`), scheduled timestamp, viewer count, tags, scripture, notes.
2. **`public.prayer_requests` Table**: ID, name, request, praying count, created timestamp.
3. **Indexes**: Optimized queries on `status` and `scheduled_at DESC`.
4. **Row Level Security (RLS)**: Public read for streams/prayers, public insert for prayer requests, service role admin privileges, fallback anon write.
5. **Realtime Publication**: Added `public.streams` and `public.prayer_requests` to `supabase_realtime` with exception guard for live client WebSocket sync.
6. **Atomic RPC Functions**:
   - `set_stream_live(p_stream_id TEXT)`: Atomically ends any currently live stream and promotes the specified stream to live.
   - `end_active_stream()`: Ends all active live broadcasts and archives them.
7. **Seed Data**: Pre-populated with the Sunday Special Online Service featuring Pastor John Jibril and official flyer.
