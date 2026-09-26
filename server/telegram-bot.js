/**
 * ============================================================================
 * BE FORTIFIED CHRISTIANS - OFFICIAL TELEGRAM ADMIN BOT & CMS
 * ============================================================================
 *
 * Dedicated Content Management System (CMS) for the church live streaming platform.
 * Directly manages Supabase PostgreSQL database records in real-time.
 *
 * Capabilities:
 *  - 🔴 One-Click Quick Live: Paste link -> Instant broadcast -> Optional flyer & scripture
 *  - ⏹️ Stop Broadcast: Choice to archive live link, paste recorded URL, or skip
 *  - 📅 Schedule Stream: Interactive wizard with flyer photo upload & Sunday timer
 *  - 📖 Update Scripture: /scripture <text> to change the Bible reading on the live player
 *  - 📝 Update Title: /title <text> to rename the live service
 *  - 📊 Status: /live to see active stream details & viewer counts
 *  - 📸 Photo Support: Send flyers directly from phone gallery!
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

console.log('\n======================================================');
console.log('🏰 BE FORTIFIED CHRISTIANS — TELEGRAM ADMIN BOT');
console.log('======================================================');

if (!TELEGRAM_BOT_TOKEN) {
  console.log('⚠️  TELEGRAM_BOT_TOKEN is missing in your .env file!');
} else {
  console.log('✅ Telegram Bot Token configured.');
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('⚠️  Supabase URL or Key is not configured in .env.');
} else {
  console.log('✅ Supabase PostgreSQL connected.');
}

const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Conversational wizard state tracker (chatId -> session)
const userSessions = new Map();

// Known authorized admin chat IDs for proactive reminders
const knownAdminChatIds = new Set();

/**
 * Supabase Keep-Alive Heartbeat
 * Pings the database so Supabase free tier never pauses due to inactivity
 */
async function pingSupabaseDatabase() {
  if (!supabase) return { success: false, message: 'Supabase client not initialized' };
  try {
    const { data, error } = await supabase.from('streams').select('id, title, status').limit(1);
    if (!error) {
      console.log(`[${new Date().toISOString()}] 💓 Supabase Keep-Alive Ping successful. Database is active.`);
      return { success: true, timestamp: new Date().toISOString() };
    }
    console.warn('Supabase ping warning:', error.message);
    return { success: false, message: error.message };
  } catch (err) {
    console.error('Supabase ping error:', err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Proactive Ministry Broadcast Check Reminder
 * Prompts admin every 3 days: "Do you have something to post today? Is there a live stream going on?"
 */
async function sendAdminBroadcastReminder() {
  if (knownAdminChatIds.size === 0) return;

  const reminderText = `🔔 <b>Ministry Broadcast Check</b>\n\n` +
    `Grace and peace, Minister / Media Team! 🕊️\n\n` +
    `• <b>Is there a live stream going on?</b>\n` +
    `• <b>Do you have a service, sermon, or announcement to post today?</b>\n\n` +
    `<i>Tap an option below to update the sanctuary:</i>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: '🔴 Quick Go Live', callback_data: 'quicklive' }],
      [{ text: '📅 Schedule Sunday Service', callback_data: 'schedulestream' }],
      [{ text: '👤 Change Minister / Pastor', callback_data: 'changepastor_active' }],
      [{ text: '✝️ Send "Amen" (Keep-Alive Ping)', callback_data: 'pingkeepalive' }]
    ]
  };

  for (const chatId of knownAdminChatIds) {
    await sendMessage(chatId, reminderText, { reply_markup: inlineKeyboard });
  }
}

/**
 * Helper to parse pastor / minister name and role title from user input
 */
function parsePastorInput(input) {
  const trimmed = (input || '').trim();
  if (!trimmed || trimmed === '⏭️ Lead Pastor (Default)' || trimmed === 'Pastor John Jibril (Lead Pastor)' || trimmed.includes('Pastor John Jibril')) {
    return { name: 'Pastor John Jibril', title: 'Lead Pastor' };
  }
  if (trimmed.includes('Resident Pastor')) {
    return { name: 'Resident Pastor', title: 'Associate Pastor' };
  }
  if (trimmed.includes('Visiting Minister') || trimmed.includes('Guest')) {
    return { name: 'Guest Minister', title: 'Visiting Speaker' };
  }
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ');
    return { name: parts[0].trim(), title: parts[1].trim() };
  }
  return {
    name: trimmed,
    title: trimmed.toLowerCase().includes('pastor') ? 'Pastor' : 'Minister'
  };
}

/**
 * YouTube Video ID parser
 */
function extractYouTubeId(urlOrId) {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Telegram API caller
 */
async function callTelegram(method, body = {}) {
  if (!TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API error on [${method}]:`, err.message);
    return null;
  }
}

async function sendMessage(chatId, text, options = {}) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...options
  });
}

async function answerCallbackQuery(callbackQueryId, text = '') {
  return callTelegram('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text
  });
}

function isAdmin(userId) {
  if (ADMIN_IDS.length === 0) return true; // Whitelist empty = all admins allowed
  return ADMIN_IDS.includes(String(userId));
}

// Persistent interactive main keyboard
const MAIN_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: '🔴 View Active Live Stream' }, { text: '🔗 Change Live Link' }],
      [{ text: '⚡ Go Live Now' }, { text: '⏹️ Stop Broadcast' }],
      [{ text: '👤 Set Minister / Pastor' }, { text: '📖 Update Scripture' }],
      [{ text: '📅 Schedule Stream' }, { text: '📋 All Streams' }],
      [{ text: '✝️ Ping Keep-Alive' }, { text: '❓ Help & Commands' }]
    ],
    resize_keyboard: true,
    persistent: true
  }
};

/**
 * Core Message Handler
 */
async function handleMessage(message) {
  const chatId = message.chat.id;
  const userId = message.from?.id;
  const text = (message.text || '').trim();
  const hasPhoto = Array.isArray(message.photo) && message.photo.length > 0;

  // Security authorization
  if (!isAdmin(userId)) {
    await sendMessage(chatId, `⛔ <b>Access Denied</b>\n\nYour Telegram User ID (<code>${userId}</code>) is not authorized.\nAdd your ID to <code>ADMIN_TELEGRAM_IDS</code> in <code>.env</code>.`);
    return;
  }

  // Register admin chat for proactive keep-alive & broadcast check notifications
  knownAdminChatIds.add(chatId);

  // Handle Cancel anytime
  if (text === '/cancel' || text === '❌ Cancel') {
    userSessions.delete(chatId);
    await sendMessage(chatId, '👍 Operation cancelled.', MAIN_KEYBOARD);
    return;
  }

  // ==========================================================================
  // ACTIVE WIZARD SESSION STATE MACHINE
  // ==========================================================================
  if (userSessions.has(chatId) && !text.startsWith('/start')) {
    const session = userSessions.get(chatId);

    // ------------------------------------------------------------------------
    // FLOW 0: PASTOR / SPEAKER SELECTION
    // ------------------------------------------------------------------------
    if (session.step === 'AWAITING_PASTOR_CHOICE') {
      const { name, title } = parsePastorInput(text);

      if (supabase && session.data?.streamId) {
        try {
          await supabase.from('streams').update({
            speaker: name,
            speaker_title: title,
            updated_at: new Date().toISOString()
          }).eq('id', session.data.streamId);
        } catch (e) {
          console.error('Supabase pastor update error:', e);
        }
      }

      userSessions.delete(chatId);
      await sendMessage(chatId, `✅ <b>Minister / Pastor Updated!</b>\n\n` +
        `👤 <b>Speaker:</b> ${name}\n` +
        `🏷️ <b>Role:</b> ${title}\n\n` +
        `<i>Updated live across the website sanctuary!</i>`, MAIN_KEYBOARD);
      return;
    }

    // ------------------------------------------------------------------------
    // FLOW 1: QUICK LIVE - STEP 1 (WAITING FOR YOUTUBE URL)
    // ------------------------------------------------------------------------
    if (session.step === 'AWAITING_QUICKLIVE_URL') {
      const videoId = extractYouTubeId(text);
      if (!videoId) {
        await sendMessage(chatId, '⚠️ Could not detect a valid YouTube link.\nPlease paste a valid YouTube live stream URL or click <b>❌ Cancel</b>:');
        return;
      }

      const streamId = 'stream_' + Date.now();
      const newStream = {
        id: streamId,
        title: 'Sunday Special Online Service: Live Broadcast',
        description: 'Welcome to the Sunday Special Online Service with Pastor John Jibril! Join our live broadcast.',
        youtube_url: text,
        youtube_video_id: videoId,
        thumbnail_url: '/sunday-special-flyer-updated.png',
        speaker: 'Pastor John Jibril',
        speaker_title: 'Lead Pastor',
        status: 'live',
        scheduled_at: new Date().toISOString(),
        viewer_count: 240,
        tags: ['Sunday Special', 'Live Broadcast', 'Pastor John Jibril'],
        scripture: 'Ephesians 6:10-18',
        notes: 'Befortified in your Mind • Befortified in your Resolve • Befortified in your Position.'
      };

      if (supabase) {
        try {
          await supabase.from('streams').update({ status: 'ended' }).eq('status', 'live');
          await supabase.from('streams').insert(newStream);
        } catch (e) {
          console.error('Supabase write error:', e);
        }
      }

      session.step = 'AWAITING_LIVE_THUMBNAIL';
      session.data = { streamId, videoId };

      await sendMessage(chatId, `🔴 <b>LIVE BROADCAST IS NOW ON AIR!</b>\n\n` +
        `<b>Video ID:</b> <code>${videoId}</code>\n` +
        `<b>Video Link:</b> https://youtu.be/${videoId}\n\n` +
        `<i>Viewers on the website can now watch this stream live!</i>\n\n` +
        `📸 <b>Optional: Attach Flyer or Thumbnail</b>\n` +
        `Send a <b>photo</b> from your phone gallery, paste an <b>image URL</b>, or tap <b>⏭️ Skip Thumbnail</b> to keep the default Sunday flyer:`, {
        reply_markup: {
          keyboard: [
            [{ text: '🖼️ Use Sunday Flyer' }, { text: '⏭️ Skip Thumbnail' }],
            [{ text: '❌ Cancel' }]
          ],
          resize_keyboard: true
        }
      });
      return;
    }

    // ------------------------------------------------------------------------
    // FLOW 1: QUICK LIVE - STEP 2 (OPTIONAL FLYER / THUMBNAIL)
    // ------------------------------------------------------------------------
    if (session.step === 'AWAITING_LIVE_THUMBNAIL') {
      let photoUrl = null;

      if (hasPhoto) {
        const photo = message.photo[message.photo.length - 1];
        const fileRes = await callTelegram('getFile', { file_id: photo.file_id });
        if (fileRes && fileRes.ok && fileRes.result?.file_path) {
          photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileRes.result.file_path}`;
        }
      } else if (text.startsWith('http://') || text.startsWith('https://')) {
        photoUrl = text;
      } else if (text === '🖼️ Use Sunday Flyer') {
        photoUrl = '/sunday-special-flyer-updated.png';
      }

      if (photoUrl && supabase && session.data?.streamId) {
        await supabase.from('streams').update({ thumbnail_url: photoUrl }).eq('id', session.data.streamId);
      }

      session.step = 'AWAITING_LIVE_SCRIPTURE';

      const thumbAck = photoUrl ? '✅ <b>Custom flyer/thumbnail attached!</b>\n\n' : '👍 <b>Keeping default Sunday flyer.</b>\n\n';

      await sendMessage(chatId, `${thumbAck}📖 <b>Optional: Add Scripture Reading</b>\n` +
        `Enter the Bible passage for today's sermon (e.g. <code>Ephesians 6:10-18</code>) or tap <b>⏭️ Keep Default</b>:`, {
        reply_markup: {
          keyboard: [
            [{ text: '⏭️ Keep Default' }],
            [{ text: '❌ Cancel' }]
          ],
          resize_keyboard: true
        }
      });
      return;
    }

    // ------------------------------------------------------------------------
    // FLOW 1: QUICK LIVE - STEP 3 (OPTIONAL SCRIPTURE READING)
    // ------------------------------------------------------------------------
    if (session.step === 'AWAITING_LIVE_SCRIPTURE') {
      if (text !== '⏭️ Keep Default' && text !== '❌ Cancel' && text.length > 2) {
        if (supabase && session.data?.streamId) {
          await supabase.from('streams').update({ scripture: text }).eq('id', session.data.streamId);
        }
      }

      session.step = 'AWAITING_LIVE_PASTOR';
      await sendMessage(chatId, `👤 <b>Who is Ministering / Preaching Today?</b>\n\n` +
        `Choose an option below or <b>type any custom name</b> (e.g. <code>Pastor Sarah Jibril</code>, <code>Minister Emmanuel</code>):\n`, {
        reply_markup: {
          keyboard: [
            [{ text: 'Pastor John Jibril (Lead Pastor)' }],
            [{ text: 'Resident Pastor (Associate Pastor)' }],
            [{ text: 'Visiting Minister (Guest Speaker)' }],
            [{ text: '⏭️ Lead Pastor (Default)' }]
          ],
          resize_keyboard: true
        }
      });
      return;
    }

    // ------------------------------------------------------------------------
    // FLOW 1: QUICK LIVE - STEP 4 (MINISTER / PASTOR SELECTION)
    // ------------------------------------------------------------------------
    if (session.step === 'AWAITING_LIVE_PASTOR') {
      const { name, title } = parsePastorInput(text);
      if (supabase && session.data?.streamId) {
        await supabase.from('streams').update({
          speaker: name,
          speaker_title: title,
          updated_at: new Date().toISOString()
        }).eq('id', session.data.streamId);
      }

      userSessions.delete(chatId);
      await sendMessage(chatId, `🎉 <b>Live Stream Setup Complete!</b>\n\n` +
        `🔴 <b>Broadcast is Live on Air!</b>\n` +
        `👤 <b>Minister:</b> ${name} (${title})\n` +
        `🔗 <b>Link:</b> https://youtu.be/${session.data?.videoId || ''}\n\n` +
        `<i>Everything is fully synchronized with your website. Enjoy the fellowship and service!</i>`, MAIN_KEYBOARD);
      return;
    }

    // ------------------------------------------------------------------------
    // FLOW 2: STOP BROADCAST - ARCHIVE SELECTION
    // ------------------------------------------------------------------------
    if (session.step === 'STOPPING_RECORDED_CHOICE') {
      const streamId = session.data?.streamId;
      const originalVideoId = session.data?.videoId;

      if (text === '📹 Save Live Video as Recorded') {
        if (supabase && streamId) {
          await supabase.from('streams').update({ status: 'ended', updated_at: new Date().toISOString() }).eq('id', streamId);
        }
        userSessions.delete(chatId);
        await sendMessage(chatId, `✅ <b>Broadcast Ended & Archived!</b>\n\nThis service has been moved to <b>Previous Recorded Videos</b> on the website so believers can rewatch it anytime.`, MAIN_KEYBOARD);
        return;
      }

      if (text === "⏭️ Skip / Do Not Archive" || text.includes("Skip")) {
        if (supabase && streamId) {
          await supabase.from('streams').update({ status: 'ended' }).eq('id', streamId);
        }
        userSessions.delete(chatId);
        await sendMessage(chatId, `⏹️ <b>Broadcast stopped without archiving.</b>`, MAIN_KEYBOARD);
        return;
      }

      // Check if user provided a recorded YouTube URL
      const recordedVideoId = extractYouTubeId(text);
      if (recordedVideoId) {
        if (supabase && streamId) {
          await supabase.from('streams').update({
            status: 'ended',
            youtube_url: text,
            youtube_video_id: recordedVideoId,
            thumbnail_url: `https://img.youtube.com/vi/${recordedVideoId}/hqdefault.jpg`,
            updated_at: new Date().toISOString()
          }).eq('id', streamId);
        }
        userSessions.delete(chatId);
        await sendMessage(chatId, `✅ <b>Recorded Sermon Saved!</b>\n\nThe recorded YouTube video (ID: <code>${recordedVideoId}</code>) is now cataloged under <b>Previous Videos</b> on the website.`, MAIN_KEYBOARD);
        return;
      }

      await sendMessage(chatId, 'Please choose one of the options below or paste a YouTube URL:');
      return;
    }

    // ------------------------------------------------------------------------
    // FLOW: CHANGE LIVE LINK ON THE FLY
    // ------------------------------------------------------------------------
    if (session.step === 'AWAITING_NEW_LINK') {
      const videoId = extractYouTubeId(text);
      if (!videoId) {
        await sendMessage(chatId, '⚠️ Could not detect a valid YouTube link.\nPlease paste a valid YouTube Live Stream URL or tap <b>❌ Cancel</b>:');
        return;
      }

      const streamId = session.data?.streamId;
      if (supabase && streamId) {
        await supabase.from('streams').update({
          youtube_url: text,
          youtube_video_id: videoId,
          updated_at: new Date().toISOString()
        }).eq('id', streamId);
      }

      userSessions.delete(chatId);
      await sendMessage(chatId, `✅ <b>Live Stream Link Updated Successfully!</b>\n\n` +
        `<b>New Video ID:</b> <code>${videoId}</code>\n` +
        `<b>Watch URL:</b> https://youtu.be/${videoId}\n\n` +
        `<i>Viewers on the website have been switched to this new video stream immediately!</i>`, MAIN_KEYBOARD);
      return;
    }

    // ------------------------------------------------------------------------
    // FLOW: UPDATE SCRIPTURE ON THE FLY
    // ------------------------------------------------------------------------
    if (session.step === 'AWAITING_NEW_SCRIPTURE') {
      const streamId = session.data?.streamId;
      if (supabase && streamId) {
        await supabase.from('streams').update({ scripture: text }).eq('id', streamId);
      }
      userSessions.delete(chatId);
      await sendMessage(chatId, `📖 <b>Today's Scripture Updated!</b>\n\nScripture: <i>"${text}"</i>\n\n<i>Updated on the live player scripture card.</i>`, MAIN_KEYBOARD);
      return;
    }

    // ------------------------------------------------------------------------
    // FLOW: UPDATE TITLE ON THE FLY
    // ------------------------------------------------------------------------
    if (session.step === 'AWAITING_NEW_TITLE') {
      const streamId = session.data?.streamId;
      if (supabase && streamId) {
        await supabase.from('streams').update({ title: text }).eq('id', streamId);
      }
      userSessions.delete(chatId);
      await sendMessage(chatId, `📝 <b>Service Title Updated!</b>\n\nNew Title: <b>"${text}"</b>\n\n<i>Updated on the website hero section.</i>`, MAIN_KEYBOARD);
      return;
    }

    // ------------------------------------------------------------------------
    // FLOW 3: SCHEDULE UPCOMING STREAM WIZARD
    // ------------------------------------------------------------------------
    if (session.step === 'AWAITING_SCHEDULE_TITLE') {
      session.data.title = text;
      session.step = 'AWAITING_SCHEDULE_URL';
      await sendMessage(chatId, `Title: <b>"${text}"</b>\n\nPlease paste the <b>YouTube Link</b> for this upcoming service:`, {
        reply_markup: {
          keyboard: [[{ text: '❌ Cancel' }]],
          resize_keyboard: true
        }
      });
      return;
    }

    if (session.step === 'AWAITING_SCHEDULE_URL') {
      const videoId = extractYouTubeId(text);
      if (!videoId) {
        await sendMessage(chatId, '⚠️ Please paste a valid YouTube link:');
        return;
      }
      session.data.youtube_url = text;
      session.data.youtube_video_id = videoId;
      session.data.thumbnail_url = '/sunday-special-flyer-updated.png';
      session.step = 'AWAITING_SCHEDULE_THUMBNAIL';

      await sendMessage(chatId, `✅ Video detected! ID: <code>${videoId}</code>\n\n` +
        `📸 <b>Optional: Attach Flyer</b>\nSend a photo from your gallery, paste an image link, or tap <b>🖼️ Use Sunday Flyer</b>:`, {
        reply_markup: {
          keyboard: [
            [{ text: '🖼️ Use Sunday Flyer' }, { text: '⏭️ Skip Flyer' }],
            [{ text: '❌ Cancel' }]
          ],
          resize_keyboard: true
        }
      });
      return;
    }

    if (session.step === 'AWAITING_SCHEDULE_THUMBNAIL') {
      if (hasPhoto) {
        const photo = message.photo[message.photo.length - 1];
        const fileRes = await callTelegram('getFile', { file_id: photo.file_id });
        if (fileRes && fileRes.ok && fileRes.result?.file_path) {
          session.data.thumbnail_url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileRes.result.file_path}`;
        }
      } else if (text.startsWith('http')) {
        session.data.thumbnail_url = text;
      }

      session.step = 'AWAITING_SCHEDULE_TIME';
      await sendMessage(chatId, `🗓️ <b>When is this service?</b>\nChoose an option or type a custom date:`, {
        reply_markup: {
          keyboard: [
            [{ text: '🗓️ Next Sunday at 2:00 PM GMT+1' }],
            [{ text: '🗓️ Midweek Wednesday 6:00 PM' }],
            [{ text: '❌ Cancel' }]
          ],
          resize_keyboard: true
        }
      });
      return;
    }

    if (session.step === 'AWAITING_SCHEDULE_TIME') {
      let scheduledDate = new Date();
      if (text.includes('Wednesday')) {
        scheduledDate.setDate(scheduledDate.getDate() + ((3 - scheduledDate.getDay() + 7) % 7 || 7));
        scheduledDate.setHours(18, 0, 0, 0);
      } else {
        // Next Sunday 2:00 PM
        scheduledDate.setDate(scheduledDate.getDate() + ((7 - scheduledDate.getDay()) % 7 || 7));
        scheduledDate.setHours(14, 0, 0, 0);
      }

      session.data.scheduledDate = scheduledDate;
      session.step = 'AWAITING_SCHEDULE_PASTOR';

      await sendMessage(chatId, `👤 <b>Who is Ministering / Preaching?</b>\n\n` +
        `Choose an option below or <b>type any minister's name</b>:`, {
        reply_markup: {
          keyboard: [
            [{ text: 'Pastor John Jibril (Lead Pastor)' }],
            [{ text: 'Resident Pastor (Associate Pastor)' }],
            [{ text: 'Visiting Minister (Guest Speaker)' }],
            [{ text: '⏭️ Lead Pastor (Default)' }]
          ],
          resize_keyboard: true
        }
      });
      return;
    }

    if (session.step === 'AWAITING_SCHEDULE_PASTOR') {
      const { name, title } = parsePastorInput(text);
      const scheduledDate = session.data.scheduledDate || new Date();

      const streamId = 'stream_' + Date.now();
      const upcomingStream = {
        id: streamId,
        title: session.data.title || 'Sunday Special Online Service',
        description: `Join ${name} for the service broadcast.`,
        youtube_url: session.data.youtube_url,
        youtube_video_id: session.data.youtube_video_id,
        thumbnail_url: session.data.thumbnail_url || '/sunday-special-flyer-updated.png',
        speaker: name,
        speaker_title: title,
        status: 'upcoming',
        scheduled_at: scheduledDate.toISOString(),
        viewer_count: 0,
        tags: ['Sunday Special', 'Upcoming', name],
        scripture: 'Ephesians 6:10-18',
        notes: 'Creed: Befortified in your Mind • Befortified in your Resolve • Befortified in your Position.'
      };

      if (supabase) {
        try {
          await supabase.from('streams').insert(upcomingStream);
        } catch (e) {
          console.error('Supabase write error:', e);
        }
      }

      userSessions.delete(chatId);
      await sendMessage(chatId, `🟡 <b>Upcoming Service Scheduled!</b>\n\n` +
        `<b>Title:</b> ${upcomingStream.title}\n` +
        `<b>Date:</b> ${scheduledDate.toUTCString()}\n` +
        `<b>Speaker:</b> ${name} (${title})\n\n` +
        `<i>Viewers will now see this under 'Upcoming Services' with countdown timer!</i>`, MAIN_KEYBOARD);
      return;
    }
  }

  // ==========================================================================
  // TOP-LEVEL COMMANDS
  // ==========================================================================

  // Start / Help / Welcome
  if (text === '/start' || text === '/help' || text === '❓ Help & Commands' || text === '/admin') {
    const welcome = `🏰 <b>BE FORTIFIED CHRISTIANS — ADMIN BOT</b>\n\n` +
      `Welcome to your live stream control center! Use the menu buttons below to manage broadcasts in real time.\n\n` +
      `<b>⚡ Quick Menu Actions:</b>\n` +
      `• <b>🔴 Go Live Now</b> — Paste a YouTube link to broadcast immediately\n` +
      `• <b>⏹️ Stop Broadcast</b> — End live service & choose whether to archive it\n` +
      `• <b>📅 Schedule Stream</b> — Schedule upcoming Sunday / Midweek service\n` +
      `• <b>📊 Current Status</b> — View live viewer count & active video\n` +
      `• <b>📋 All Streams</b> — View catalogue & switch active broadcasts\n\n` +
      `<b>📖 In-Service Controls:</b>\n` +
      `• <code>/scripture &lt;passage&gt;</code> — Update today's scripture on the live player\n` +
      `• <code>/title &lt;sermon title&gt;</code> — Rename current broadcast\n\n` +
      `<i>Your Telegram ID:</i> <code>${userId}</code>`;
    await sendMessage(chatId, welcome, MAIN_KEYBOARD);
    return;
  }

  // 1. One-Click Go Live
  if (text === '🔴 Go Live Now' || text === '/quicklive') {
    userSessions.set(chatId, { step: 'AWAITING_QUICKLIVE_URL', data: {} });
    await sendMessage(chatId, `🔴 <b>Quick Live Broadcast</b>\n\n` +
      `Please paste your <b>YouTube Live Stream URL</b>:\n` +
      `<i>(e.g. https://youtube.com/watch?v=... or https://youtu.be/...)</i>`, {
      reply_markup: {
        keyboard: [[{ text: '❌ Cancel' }]],
        resize_keyboard: true
      }
    });
    return;
  }

  // 2. Schedule Stream
  if (text === '📅 Schedule Stream' || text === '/newstream' || text === '/schedule') {
    userSessions.set(chatId, { step: 'AWAITING_SCHEDULE_TITLE', data: {} });
    await sendMessage(chatId, `📅 <b>Schedule Upcoming Service</b>\n\n` +
      `Please enter the <b>Title of the Service</b>:\n` +
      `<i>(e.g. "Sunday Special: Divine Fortification")</i>`, {
      reply_markup: {
        keyboard: [[{ text: '❌ Cancel' }]],
        resize_keyboard: true
      }
    });
    return;
  }

  // 3. Stop Broadcast
  if (text === '⏹️ Stop Broadcast' || text === '/stop' || text === '/endlive') {
    if (!supabase) {
      await sendMessage(chatId, '⚠️ Supabase is not connected in .env.', MAIN_KEYBOARD);
      return;
    }

    const { data: liveStream } = await supabase.from('streams').select('*').eq('status', 'live').maybeSingle();

    if (!liveStream) {
      await sendMessage(chatId, `ℹ️ <b>No stream is currently LIVE on the website.</b>`, MAIN_KEYBOARD);
      return;
    }

    userSessions.set(chatId, {
      step: 'STOPPING_RECORDED_CHOICE',
      data: { streamId: liveStream.id, videoId: liveStream.youtube_video_id }
    });

    await sendMessage(chatId, `⏹️ <b>End Live Broadcast: "${liveStream.title}"</b>\n\n` +
      `Do you want this service saved to <b>Previous Recorded Videos</b> on the website?\n\n` +
      `• Tap <b>📹 Save Live Video as Recorded</b>\n` +
      `• Or <b>paste a new YouTube URL</b> for the recorded sermon\n` +
      `• Or tap <b>⏭️ Skip / Don't Archive</b>:`, {
      reply_markup: {
        keyboard: [
          [{ text: '📹 Save Live Video as Recorded' }],
          [{ text: "⏭️ Skip / Do Not Archive" }],
          [{ text: '❌ Cancel' }]
        ],
        resize_keyboard: true
      }
    });
    return;
  }

  // 4. Current Status / View Active Live Stream
  if (text === '🔴 View Active Live Stream' || text === '🔴 Active Live Stream' || text === '📊 Current Status' || text === '/live') {
    if (!supabase) {
      await sendMessage(chatId, '⚠️ Supabase is not connected.', MAIN_KEYBOARD);
      return;
    }

    const { data } = await supabase.from('streams').select('*').eq('status', 'live').maybeSingle();
    if (!data) {
      await sendMessage(chatId, `ℹ️ <b>No stream is currently LIVE.</b>\n\nTap <b>⚡ Go Live Now</b> to start broadcasting.`, MAIN_KEYBOARD);
    } else {
      await sendMessage(chatId, `🔴 <b>CURRENT LIVE BROADCAST:</b>\n\n` +
        `<b>${data.title}</b>\n` +
        `👤 <b>Speaker:</b> ${data.speaker}\n` +
        `📖 <b>Scripture:</b> ${data.scripture || 'Not set'}\n` +
        `👥 <b>Viewers:</b> ${data.viewer_count || 0}\n` +
        `🔗 <b>YouTube Link:</b> https://youtu.be/${data.youtube_video_id}\n\n` +
        `<i>Tap an action button below to manage or change this broadcast:</i>`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Change Live Link', callback_data: `changelink_${data.id}` }],
            [{ text: '👤 Change Minister', callback_data: `changepastor_${data.id}` }],
            [{ text: '📖 Edit Scripture', callback_data: `changescripture_${data.id}` }, { text: '📝 Edit Title', callback_data: `changetitle_${data.id}` }],
            [{ text: '⏹️ Stop Broadcast', callback_data: `stop_${data.id}` }]
          ]
        }
      });
    }
    return;
  }

  // 4D. Set Minister / Pastor
  if (text === '👤 Set Minister / Pastor' || text.startsWith('/pastor') || text.startsWith('/minister')) {
    if (!supabase) {
      await sendMessage(chatId, '⚠️ Supabase is not connected in .env.', MAIN_KEYBOARD);
      return;
    }

    const { data: liveStream } = await supabase.from('streams').select('*').eq('status', 'live').maybeSingle();
    if (!liveStream) {
      await sendMessage(chatId, 'ℹ️ No broadcast is currently LIVE on the website.\n\nTap <b>⚡ Go Live Now</b> to start a broadcast first.', MAIN_KEYBOARD);
      return;
    }

    userSessions.set(chatId, {
      step: 'AWAITING_PASTOR_CHOICE',
      data: { streamId: liveStream.id }
    });

    await sendMessage(chatId, `👤 <b>Set Minister / Pastor for Live Broadcast</b>\n\n` +
      `<b>Service:</b> ${liveStream.title}\n` +
      `<b>Current Speaker:</b> ${liveStream.speaker} (${liveStream.speaker_title || 'Lead Pastor'})\n\n` +
      `Select a minister below or <b>type a custom name</b>:\n` +
      `<i>(e.g. "Pastor Sarah Jibril", "Minister Emmanuel", etc.)</i>`, {
      reply_markup: {
        keyboard: [
          [{ text: 'Pastor John Jibril (Lead Pastor)' }],
          [{ text: 'Resident Pastor (Associate Pastor)' }],
          [{ text: 'Visiting Minister (Guest Speaker)' }],
          [{ text: '❌ Cancel' }]
        ],
        resize_keyboard: true
      }
    });
    return;
  }

  // 4E. Keep-Alive Heartbeat / Ping
  if (text === '✝️ Ping Keep-Alive' || text === '/ping' || text === '/amen') {
    const res = await pingSupabaseDatabase();
    if (res.success) {
      await sendMessage(chatId, `✅ <b>Amen! Database Server is 100% Live & Active!</b>\n\n` +
        `🕒 <b>Timestamp:</b> ${new Date().toUTCString()}\n` +
        `⚡ <b>Supabase PostgreSQL:</b> Responsive & Connected\n` +
        `🛡️ <b>Inactivity Timer:</b> Successfully reset!`, MAIN_KEYBOARD);
    } else {
      await sendMessage(chatId, `⚠️ <b>Keep-Alive Warning:</b> ${res.message || 'Check database connectivity'}`, MAIN_KEYBOARD);
    }
    return;
  }

  // 4F. Test Broadcast Reminder
  if (text === '/reminder' || text === '/checkbroadcast') {
    await sendAdminBroadcastReminder();
    await sendMessage(chatId, '🔔 Broadcast reminder notification sent!', MAIN_KEYBOARD);
    return;
  }

  // 4B. Change Live Link Command / Button
  if (text === '🔗 Change Live Link' || text.startsWith('/changelink') || text.startsWith('/link')) {
    if (!supabase) {
      await sendMessage(chatId, '⚠️ Supabase is not connected.', MAIN_KEYBOARD);
      return;
    }

    const { data } = await supabase.from('streams').select('*').eq('status', 'live').maybeSingle();
    if (!data) {
      await sendMessage(chatId, 'ℹ️ No broadcast is currently LIVE on the website.\n\nTap <b>⚡ Go Live Now</b> to start a new broadcast.', MAIN_KEYBOARD);
      return;
    }

    // Direct link passed in command: /changelink <url>
    const directUrl = text.replace('/changelink', '').replace('/link', '').trim();
    if (directUrl) {
      const newVideoId = extractYouTubeId(directUrl);
      if (newVideoId) {
        await supabase.from('streams').update({
          youtube_url: directUrl,
          youtube_video_id: newVideoId,
          updated_at: new Date().toISOString()
        }).eq('id', data.id);

        await sendMessage(chatId, `✅ <b>Live Stream Link Updated!</b>\n\n` +
          `<b>New Video ID:</b> <code>${newVideoId}</code>\n` +
          `<b>Watch URL:</b> https://youtu.be/${newVideoId}\n\n` +
          `<i>Website viewers have been switched to the new stream in real time!</i>`, MAIN_KEYBOARD);
        return;
      }
    }

    userSessions.set(chatId, {
      step: 'AWAITING_NEW_LINK',
      data: { streamId: data.id, currentVideoId: data.youtube_video_id }
    });

    await sendMessage(chatId, `🔄 <b>Change Live Stream Link</b>\n\n` +
      `<b>Current Video:</b> https://youtu.be/${data.youtube_video_id}\n\n` +
      `Please paste the <b>new YouTube Live Stream URL</b> to switch viewers to:\n` +
      `<i>(e.g. https://youtube.com/watch?v=... or https://youtu.be/...)</i>`, {
      reply_markup: {
        keyboard: [[{ text: '❌ Cancel' }]],
        resize_keyboard: true
      }
    });
    return;
  }

  // 4C. Update Scripture button on keyboard
  if (text === '📖 Update Scripture') {
    if (!supabase) {
      await sendMessage(chatId, '⚠️ Supabase is not connected.', MAIN_KEYBOARD);
      return;
    }

    const { data } = await supabase.from('streams').select('*').eq('status', 'live').maybeSingle();
    if (!data) {
      await sendMessage(chatId, 'ℹ️ No broadcast is currently LIVE. Please go live first.', MAIN_KEYBOARD);
      return;
    }

    userSessions.set(chatId, {
      step: 'AWAITING_NEW_SCRIPTURE',
      data: { streamId: data.id }
    });

    await sendMessage(chatId, `📖 <b>Update Scripture Reading</b>\n\n` +
      `Current: <i>"${data.scripture || 'Not set'}"</i>\n\n` +
      `Please enter the new Bible passage (e.g. <code>Ephesians 6:10-18</code>):`, {
      reply_markup: {
        keyboard: [[{ text: '❌ Cancel' }]],
        resize_keyboard: true
      }
    });
    return;
  }

  // 5. Update Scripture on the Fly: /scripture <passage>
  if (text.startsWith('/scripture')) {
    const passage = text.replace('/scripture', '').trim();
    if (!passage) {
      await sendMessage(chatId, 'Usage: <code>/scripture Ephesians 6:10-18</code>');
      return;
    }
    if (supabase) {
      await supabase.from('streams').update({ scripture: passage }).eq('status', 'live');
    }
    await sendMessage(chatId, `📖 <b>Scripture reading updated to:</b> <i>"${passage}"</i> on the live player!`, MAIN_KEYBOARD);
    return;
  }

  // 6. Update Title on the Fly: /title <new title>
  if (text.startsWith('/title')) {
    const newTitle = text.replace('/title', '').trim();
    if (!newTitle) {
      await sendMessage(chatId, 'Usage: <code>/title Sunday Special: The Armor of God</code>');
      return;
    }
    if (supabase) {
      await supabase.from('streams').update({ title: newTitle }).eq('status', 'live');
    }
    await sendMessage(chatId, `📝 <b>Service title updated to:</b> <b>"${newTitle}"</b>!`, MAIN_KEYBOARD);
    return;
  }

  // 7. View All Streams
  if (text === '📋 All Streams' || text === '/streams') {
    if (!supabase) {
      await sendMessage(chatId, '⚠️ Supabase is not connected.', MAIN_KEYBOARD);
      return;
    }

    const { data } = await supabase
      .from('streams')
      .select('id, title, status, speaker, scheduled_at')
      .order('scheduled_at', { ascending: false })
      .limit(6);

    if (!data || data.length === 0) {
      await sendMessage(chatId, 'No streams found in database.', MAIN_KEYBOARD);
      return;
    }

    let msg = '📋 <b>Recent Streams:</b>\n\n';
    const inlineButtons = [];

    data.forEach((s, idx) => {
      const badge = s.status === 'live' ? '🔴 LIVE' : (s.status === 'upcoming' ? '🟡 UPCOMING' : '▶️ ENDED');
      msg += `${idx + 1}. [${badge}] <b>${s.title}</b>\nID: <code>${s.id}</code>\n\n`;

      if (s.status !== 'live') {
        inlineButtons.push([{ text: `🔴 Make #${idx + 1} Live`, callback_data: `live_${s.id}` }]);
      }
    });

    await sendMessage(chatId, msg, {
      reply_markup: { inline_keyboard: inlineButtons.slice(0, 4) }
    });
    return;
  }

  // Fallback: If user sent a photo without an active session, ask if they want to use it as the live flyer
  if (hasPhoto) {
    const photo = message.photo[message.photo.length - 1];
    const fileRes = await callTelegram('getFile', { file_id: photo.file_id });
    if (fileRes && fileRes.ok && fileRes.result?.file_path) {
      const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileRes.result.file_path}`;
      if (supabase) {
        await supabase.from('streams').update({ thumbnail_url: photoUrl }).eq('status', 'live');
      }
      await sendMessage(chatId, `🖼️ <b>Flyer updated on the active live broadcast!</b>\nViewers will see this flyer on the website homepage.`, MAIN_KEYBOARD);
      return;
    }
  }
}

/**
 * Handle Inline Button Clicks (Callback Queries)
 */
async function handleCallbackQuery(cbQuery) {
  const queryId = cbQuery.id;
  const data = cbQuery.data || '';
  const chatId = cbQuery.message?.chat?.id;

  if (data.startsWith('live_')) {
    const id = data.replace('live_', '');
    if (supabase) {
      await supabase.from('streams').update({ status: 'ended' }).eq('status', 'live');
      await supabase.from('streams').update({ status: 'live' }).eq('id', id);
    }
    await answerCallbackQuery(queryId, '🔴 Stream is now LIVE!');
    if (chatId) {
      await sendMessage(chatId, `🔴 Stream is now LIVE on the website!`, MAIN_KEYBOARD);
    }
    return;
  }

  if (data.startsWith('stop_')) {
    if (supabase) {
      await supabase.from('streams').update({ status: 'ended' }).eq('status', 'live');
    }
    await answerCallbackQuery(queryId, '⏹️ Stream stopped');
    if (chatId) {
      await sendMessage(chatId, '⏹️ Broadcast ended and archived under Previous Videos.', MAIN_KEYBOARD);
    }
    return;
  }

  if (data.startsWith('changelink_')) {
    const id = data.replace('changelink_', '');
    userSessions.set(chatId, { step: 'AWAITING_NEW_LINK', data: { streamId: id } });
    await answerCallbackQuery(queryId);
    if (chatId) {
      await sendMessage(chatId, `🔄 <b>Change YouTube Link</b>\n\nPlease paste the <b>new YouTube Live Stream URL</b>:`, {
        reply_markup: {
          keyboard: [[{ text: '❌ Cancel' }]],
          resize_keyboard: true
        }
      });
    }
    return;
  }

  if (data.startsWith('changescripture_')) {
    const id = data.replace('changescripture_', '');
    userSessions.set(chatId, { step: 'AWAITING_NEW_SCRIPTURE', data: { streamId: id } });
    await answerCallbackQuery(queryId);
    if (chatId) {
      await sendMessage(chatId, `📖 <b>Update Scripture Reading</b>\n\nPlease enter the new Bible passage (e.g. <code>Ephesians 6:10-18</code>):`, {
        reply_markup: {
          keyboard: [[{ text: '❌ Cancel' }]],
          resize_keyboard: true
        }
      });
    }
    return;
  }

  if (data.startsWith('changetitle_')) {
    const id = data.replace('changetitle_', '');
    userSessions.set(chatId, { step: 'AWAITING_NEW_TITLE', data: { streamId: id } });
    await answerCallbackQuery(queryId);
    if (chatId) {
      await sendMessage(chatId, `📝 <b>Update Sermon Title</b>\n\nPlease enter the new title for this service:`, {
        reply_markup: {
          keyboard: [[{ text: '❌ Cancel' }]],
          resize_keyboard: true
        }
      });
    }
    return;
  }

  if (data.startsWith('changepastor_')) {
    let id = data.replace('changepastor_', '');
    if (id === 'active' && supabase) {
      const { data: liveStream } = await supabase.from('streams').select('id').eq('status', 'live').maybeSingle();
      if (liveStream) id = liveStream.id;
    }
    userSessions.set(chatId, { step: 'AWAITING_PASTOR_CHOICE', data: { streamId: id } });
    await answerCallbackQuery(queryId);
    if (chatId) {
      await sendMessage(chatId, `👤 <b>Select Minister / Pastor for Broadcast:</b>\n\n` +
        `Tap an option below or type a custom name:`, {
        reply_markup: {
          keyboard: [
            [{ text: 'Pastor John Jibril (Lead Pastor)' }],
            [{ text: 'Resident Pastor (Associate Pastor)' }],
            [{ text: 'Visiting Minister (Guest Speaker)' }],
            [{ text: '❌ Cancel' }]
          ],
          resize_keyboard: true
        }
      });
    }
    return;
  }

  if (data === 'pingkeepalive') {
    const res = await pingSupabaseDatabase();
    await answerCallbackQuery(queryId, 'Amen! Keep-alive ping sent.');
    if (chatId) {
      await sendMessage(chatId, `✅ <b>Amen! Database Server is 100% Live & Active!</b>\n\n` +
        `🕒 <b>Timestamp:</b> ${new Date().toUTCString()}\n` +
        `⚡ Supabase PostgreSQL touched and verified.`, MAIN_KEYBOARD);
    }
    return;
  }

  await answerCallbackQuery(queryId);
}

/**
 * Polling Engine
 */
let lastUpdateId = 0;

async function pollUpdates() {
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    const res = await callTelegram('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 30
    });

    if (res && res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        lastUpdateId = update.update_id;
        if (update.message) {
          await handleMessage(update.message);
        } else if (update.callback_query) {
          await handleCallbackQuery(update.callback_query);
        }
      }
    }
  } catch (err) {
    console.error('Polling error:', err.message);
  }

  setTimeout(pollUpdates, 1000);
}

if (TELEGRAM_BOT_TOKEN) {
  console.log('🤖 Telegram Admin Bot is polling and ready for commands!');
  pollUpdates();

  // Run initial Supabase keep-alive ping on startup
  pingSupabaseDatabase();

  // Ping Supabase every 24 hours to keep PostgreSQL alive indefinitely
  setInterval(pingSupabaseDatabase, 24 * 60 * 60 * 1000);

  // Send broadcast check reminder to admin every 3 days (72 hours)
  setInterval(sendAdminBroadcastReminder, 72 * 60 * 60 * 1000);
} else {
  console.log('ℹ️  Bot script prepared. Provide TELEGRAM_BOT_TOKEN in .env and run: npm run bot');
}
