import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or runtime localStorage config
export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('bf_supabase_url') || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('bf_supabase_key') || '' : '';

  const url = (storedUrl || envUrl).trim();
  const key = (storedKey || envKey).trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key && url.startsWith('http'))
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance || (supabaseInstance as any).__url !== url) {
    try {
      supabaseInstance = createClient(url, key);
      (supabaseInstance as any).__url = url;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bf_supabase_url', url.trim());
    localStorage.setItem('bf_supabase_key', key.trim());
    supabaseInstance = null; // force re-instantiation
  }
}
