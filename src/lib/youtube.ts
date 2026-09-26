import type { Stream } from '../types/stream';

/**
 * Extracts YouTube Video ID from any valid YouTube URL or direct ID
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common patterns
  // 1. youtube.com/watch?v=XYZ
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // 2. youtu.be/XYZ
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // 3. youtube.com/live/XYZ
  const liveMatch = trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch) return liveMatch[1];

  // 4. youtube.com/embed/XYZ
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // 5. youtube.com/shorts/XYZ
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

/**
 * Builds the embed URL with parameters optimized for clean church stream viewing
 */
export function getYouTubeEmbedUrl(videoId: string, options: { autoplay?: boolean; mute?: boolean } = {}): string {
  const base = `https://www.youtube.com/embed/${videoId}`;
  const params = new URLSearchParams({
    autoplay: options.autoplay ? '1' : '0',
    mute: options.mute ? '1' : '0',
    rel: '0',
    playsinline: '1',
    enablejsapi: '1'
  });
  return `${base}?${params.toString()}`;
}

/**
 * Gets the standard high quality thumbnail URL from YouTube
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Format ISO date string into readable service date and time
 */
export function formatStreamDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoDate;
  }
}

/**
 * Format relative countdown string (e.g. "Starts in 2h 15m")
 */
export function getCountdown(isoDate: string): { text: string; isPast: boolean; days: number; hours: number; minutes: number } {
  const target = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { text: 'Scheduled time passed', isPast: true, days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return { text: `In ${days}d ${hours}h`, isPast: false, days, hours, minutes };
  }
  if (hours > 0) {
    return { text: `In ${hours}h ${minutes}m`, isPast: false, days, hours, minutes };
  }
  return { text: `In ${minutes}m`, isPast: false, days, hours, minutes };
}

/**
 * Generate iCal (.ics) file content for church service reminders
 */
export function generateIcsCalendar(stream: Stream): string {
  const startDate = new Date(stream.scheduled_at);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // assume 2 hours

  const formatIcsTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Be Fortified Christians//Church Stream Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${stream.id}@befortified.org`,
    `DTSTAMP:${formatIcsTime(new Date())}`,
    `DTSTART:${formatIcsTime(startDate)}`,
    `DTEND:${formatIcsTime(endDate)}`,
    `SUMMARY:${stream.title}`,
    `DESCRIPTION:${stream.description || 'Watch live at Be Fortified Christians'} - ${stream.youtube_url}`,
    'LOCATION:Be Fortified Christians Live Stream (Online)',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Downloads .ics calendar invite directly in user browser
 */
export function downloadCalendarInvite(stream: Stream) {
  const icsData = generateIcsCalendar(stream);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${stream.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
