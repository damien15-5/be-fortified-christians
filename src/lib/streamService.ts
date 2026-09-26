import type { Stream, StreamStatus } from '../types/stream';
import { getSupabaseClient } from './supabase';
import { extractYouTubeId, getYouTubeThumbnail } from './youtube';

// Initial high-quality starter stream for Be Fortified Christians
export const INITIAL_STREAMS: Stream[] = [
  {
    id: 'stream-sunday-special-01',
    title: 'Sunday Special Online Service: Befortified in Mind, Resolve & Position',
    description: 'Join Pastor John Jibril for the Sunday Special broadcast! Experience the fortified presence of God, prophetic impartation, and divine alignment. Streaming live every Sunday at 2:00PM (GMT+1).',
    youtube_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    youtube_video_id: 'kJQP7kiw5Fk',
    thumbnail_url: '/sunday-special-flyer-updated.png',
    speaker: 'Pastor John Jibril',
    speaker_title: 'Lead Pastor & Founder',
    status: 'live',
    scheduled_at: new Date().toISOString(),
    viewer_count: 2480,
    tags: ['Sunday Special', 'Pastor John Jibril', 'Befortified', 'Prophetic'],
    scripture: 'Ephesians 6:10, 1 Corinthians 15:58',
    notes: 'Key Pillars: 1. Befortified in your mind. 2. Befortified in your resolve. 3. Befortified in your position.'
  }
];

const LOCAL_STORAGE_KEY = 'bf_streams_v1';

function getLocalStreams(): Stream[] {
  if (typeof window === 'undefined') return INITIAL_STREAMS;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_STREAMS));
      return INITIAL_STREAMS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_STREAMS;
  }
}

function saveLocalStreams(streams: Stream[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(streams));
  }
}

export const StreamService = {
  async getAllStreams(): Promise<Stream[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('streams')
          .select('*')
          .order('scheduled_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as Stream[];
        }
      } catch (err) {
        console.warn('Supabase query error, falling back to local store:', err);
      }
    }
    return getLocalStreams();
  },

  async getStreamById(id: string): Promise<Stream | null> {
    const streams = await this.getAllStreams();
    return streams.find(s => s.id === id) || null;
  },

  async getLiveStream(): Promise<Stream | null> {
    const streams = await this.getAllStreams();
    return streams.find(s => s.status === 'live') || null;
  },

  async getUpcomingStreams(): Promise<Stream[]> {
    const streams = await this.getAllStreams();
    return streams.filter(s => s.status === 'upcoming');
  },

  async getPreviousStreams(): Promise<Stream[]> {
    const streams = await this.getAllStreams();
    return streams.filter(s => s.status === 'ended');
  },

  async createStream(input: {
    title: string;
    description: string;
    youtube_url: string;
    thumbnail_url?: string;
    speaker: string;
    speaker_title?: string;
    status: StreamStatus;
    scheduled_at: string;
    tags?: string[];
    scripture?: string;
    notes?: string;
  }): Promise<Stream> {
    const videoId = extractYouTubeId(input.youtube_url) || 'kJQP7kiw5Fk';
    const thumb = input.thumbnail_url || getYouTubeThumbnail(videoId);

    const newStream: Stream = {
      id: 'stream_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: input.title,
      description: input.description,
      youtube_url: input.youtube_url,
      youtube_video_id: videoId,
      thumbnail_url: thumb,
      speaker: input.speaker,
      speaker_title: input.speaker_title || 'Guest Speaker',
      status: input.status,
      scheduled_at: input.scheduled_at,
      viewer_count: input.status === 'live' ? Math.floor(Math.random() * 200) + 50 : 0,
      tags: input.tags && input.tags.length > 0 ? input.tags : ['Service'],
      scripture: input.scripture || '',
      notes: input.notes || '',
      created_at: new Date().toISOString()
    };

    // If new stream is set to 'live', automatically change other live streams to ended
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        if (newStream.status === 'live') {
          await supabase.from('streams').update({ status: 'ended' }).eq('status', 'live');
        }
        const { data, error } = await supabase.from('streams').insert(newStream).select().single();
        if (!error && data) {
          return data as Stream;
        }
      } catch (err) {
        console.warn('Failed to insert into Supabase, saving locally:', err);
      }
    }

    // Local save
    const current = getLocalStreams();
    let updated = current;
    if (newStream.status === 'live') {
      updated = updated.map(s => s.status === 'live' ? { ...s, status: 'ended' as StreamStatus } : s);
    }
    updated = [newStream, ...updated];
    saveLocalStreams(updated);
    return newStream;
  },

  async updateStream(id: string, updates: Partial<Stream>): Promise<Stream | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        if (updates.status === 'live') {
          await supabase.from('streams').update({ status: 'ended' }).eq('status', 'live');
        }
        const { data, error } = await supabase.from('streams').update(updates).eq('id', id).select().single();
        if (!error && data) {
          return data as Stream;
        }
      } catch (err) {
        console.warn('Failed to update Supabase stream, updating locally:', err);
      }
    }

    const current = getLocalStreams();
    const target = current.find(s => s.id === id);
    if (!target) return null;

    let updated = current.map(s => {
      if (updates.status === 'live' && s.id !== id && s.status === 'live') {
        return { ...s, status: 'ended' as StreamStatus };
      }
      if (s.id === id) {
        return { ...s, ...updates };
      }
      return s;
    });

    saveLocalStreams(updated);
    return updated.find(s => s.id === id) || null;
  },

  async setStatus(id: string, status: StreamStatus): Promise<Stream | null> {
    return this.updateStream(id, { status });
  },

  async deleteStream(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('streams').delete().eq('id', id);
      } catch (err) {
        console.warn('Failed to delete from Supabase:', err);
      }
    }

    const current = getLocalStreams();
    const filtered = current.filter(s => s.id !== id);
    saveLocalStreams(filtered);
    return true;
  },

  subscribeToStreams(onUpdate: () => void): () => void {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    try {
      const channel = supabase
        .channel('public:streams:realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'streams' },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription error:', err);
      return () => {};
    }
  },

  resetDefaults(): Stream[] {
    saveLocalStreams(INITIAL_STREAMS);
    return INITIAL_STREAMS;
  }
};
