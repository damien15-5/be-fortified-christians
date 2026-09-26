# Memory 001: Project Architecture & Foundations

## Context & Objectives
The user requested a streaming platform for **Be Fortified Christians (Church)** powered by YouTube streaming embeds, backed by **Supabase**, and managed by **Telegram Bot** (and web admin fallback).

### Key Directives & Preferences
1. **Visual Style**:
   - **Background**: Crisp clean white background (`#FFFFFF`, `#F8FAFC`).
   - **Primary Color**: Regal Christian Royal Blue (`#1E3A8A`, `#2563EB`, `#1D4ED8`).
   - **Accent Color**: Divine Gold (`#D97706`, `#B45309`, `#F59E0B`, metallic gradients).
   - **Typography**: Modern Google Fonts (Outfit / Plus Jakarta Sans / Inter).
   - **Design Guidelines**: Followed UI/UX ProMax standards with subtle glassmorphism, micro-interactions, responsive layout, clear status badges (Live, Upcoming, Previous).
2. **Platform Features**:
   - **Home**: Live Stream spotlight hero with responsive YouTube player, quick live status, upcoming stream carousel/grid, recent sermon archives, devotional highlights.
   - **Live Page (`/live`)**: Dedicated live experience with YouTube live stream embed, viewer count counter, stream title, pastor/speaker info, scripture reading, interactive prayer requests, notes/bulletin download, and live reactions.
   - **Upcoming Page (`/upcoming`)**: Scheduled broadcasts with countdown timers, "Add to Calendar" / "Remind me", sermon series tags, speaker info.
   - **Previous Page (`/previous`)**: Video archive of past streams and sermons with search, filtering by speaker/series/topic, playback modals/pages.
   - **Admin Management**:
     - Telegram Bot backend handling `/newstream`, `/setlive`, `/endstream`, `/list`, `/delete` commands.
     - Web Admin interface allowing stream creation, status toggling, YouTube URL parsing, and Supabase synchronization.
3. **Database Schema (Supabase)**:
   - Table `streams`:
     - `id`: UUID (Primary Key)
     - `title`: text
     - `description`: text
     - `youtube_url`: text
     - `youtube_video_id`: text (extracted)
     - `thumbnail_url`: text
     - `speaker`: text
     - `status`: text ('upcoming', 'live', 'ended')
     - `scheduled_at`: timestamptz
     - `viewer_count`: integer default 0
     - `tags`: text[]
     - `created_at`: timestamptz default now()
4. **Resilience**:
   - Built-in Supabase client with offline/mock fallback when Supabase URL/key are not yet connected, so the UI is fully functional and interactive from second 1.
