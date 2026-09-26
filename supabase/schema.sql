-- ============================================================================
-- BE FORTIFIED CHRISTIANS - SUPABASE DATABASE SCHEMA
-- Streaming Platform & YouTube Live Integration
-- ============================================================================

-- 1. STREAMS TABLE
CREATE TABLE IF NOT EXISTS public.streams (
  id TEXT PRIMARY KEY DEFAULT ('stream_' || floor(extract(epoch from now()) * 1000)::text),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  thumbnail_url TEXT,
  speaker TEXT NOT NULL DEFAULT 'Pastor John Jibril',
  speaker_title TEXT DEFAULT 'Lead Pastor',
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'live', 'ended')) DEFAULT 'upcoming',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewer_count INT DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY['Sunday Special', 'Pastor John Jibril']::TEXT[],
  scripture TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for speedy queries on status and scheduled dates
CREATE INDEX IF NOT EXISTS idx_streams_status ON public.streams(status);
CREATE INDEX IF NOT EXISTS idx_streams_scheduled_at ON public.streams(scheduled_at DESC);

-- 2. PRAYER REQUESTS TABLE (COMMUNITY INTERACTION)
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  request TEXT NOT NULL,
  praying_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- Enable Realtime for live updates on website
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.streams;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_requests;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;

-- 4. POLICIES FOR STREAMS
-- Everyone can read published streams
DROP POLICY IF EXISTS "Allow public read access to streams" ON public.streams;
CREATE POLICY "Allow public read access to streams"
  ON public.streams
  FOR SELECT
  USING (true);

-- Allow service role full control (Telegram Bot & Edge Functions)
DROP POLICY IF EXISTS "Allow service role full control on streams" ON public.streams;
CREATE POLICY "Allow service role full control on streams"
  ON public.streams
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also allow public write during development/testing if service key isn't provided
DROP POLICY IF EXISTS "Allow anon manage streams" ON public.streams;
CREATE POLICY "Allow anon manage streams"
  ON public.streams
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 5. POLICIES FOR PRAYER REQUESTS
DROP POLICY IF EXISTS "Allow public read prayer requests" ON public.prayer_requests;
CREATE POLICY "Allow public read prayer requests"
  ON public.prayer_requests
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert prayer requests" ON public.prayer_requests;
CREATE POLICY "Allow public insert prayer requests"
  ON public.prayer_requests
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public increment prayer requests" ON public.prayer_requests;
CREATE POLICY "Allow public increment prayer requests"
  ON public.prayer_requests
  FOR UPDATE
  USING (true);

-- 6. STORED PROCEDURES / RPC FUNCTIONS FOR TELEGRAM BOT & EDGE FUNCTIONS

-- Atomically switch a stream to LIVE, ending any currently live broadcast
CREATE OR REPLACE FUNCTION public.set_stream_live(p_stream_id TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_stream json;
BEGIN
  -- 1. Demote any current active live stream to ended
  UPDATE public.streams
  SET status = 'ended', updated_at = now()
  WHERE status = 'live';

  -- 2. Promote the target stream to live
  UPDATE public.streams
  SET status = 'live', scheduled_at = now(), updated_at = now()
  WHERE id = p_stream_id
  RETURNING row_to_json(streams.*) INTO v_updated_stream;

  RETURN v_updated_stream;
END;
$$;

-- Atomically end any currently active live broadcast
CREATE OR REPLACE FUNCTION public.end_active_stream()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.streams
  SET status = 'ended', updated_at = now()
  WHERE status = 'live';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 7. INITIAL SEED (Featuring Pastor John Jibril & Sunday Special Online Service)
INSERT INTO public.streams (
  id, title, description, youtube_url, youtube_video_id, thumbnail_url,
  speaker, speaker_title, status, scheduled_at, viewer_count, tags, scripture, notes
) VALUES 
(
  'stream-live-sunday-special',
  'Sunday Special Online Service: Live Broadcast',
  'Welcome to the Sunday Special Online Service with Pastor John Jibril! Join our live broadcast as we receive divine fortification for our minds, unshakable resolve in faith, and steadfast standing in Christ Jesus.',
  'https://www.youtube.com/watch?v=RHUauMcYlX0',
  'RHUauMcYlX0',
  '/sunday-special-flyer-updated.png',
  'Pastor John Jibril',
  'Lead Pastor',
  'live',
  now(),
  1,
  ARRAY['Sunday Special', 'Live Broadcast', 'Pastor John Jibril', 'Fortification'],
  'Ephesians 6:10-18',
  'Creed: Befortified in your Mind • Befortified in your Resolve • Befortified in your Position.'
)
ON CONFLICT (id) DO NOTHING;
