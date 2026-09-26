export type StreamStatus = 'upcoming' | 'live' | 'ended';

export interface Stream {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  youtube_video_id: string;
  thumbnail_url: string;
  speaker: string;
  speaker_title?: string;
  status: StreamStatus;
  scheduled_at: string;
  viewer_count?: number;
  tags?: string[];
  scripture?: string;
  notes?: string;
  created_at?: string;
}

export interface PrayerRequest {
  id: string;
  name: string;
  request: string;
  created_at: string;
  praying_count: number;
}
