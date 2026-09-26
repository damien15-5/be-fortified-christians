// ============================================================================
// BE FORTIFIED CHRISTIANS - TELEGRAM ADMIN WEBHOOK EDGE FUNCTION
// Deployed to Supabase Edge Runtime (Deno)
// Endpoint: https://<project-ref>.supabase.co/functions/v1/telegram-webhook
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_IDS_RAW = Deno.env.get("ADMIN_TELEGRAM_IDS") || "";

const ADMIN_IDS = ADMIN_IDS_RAW.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

/**
 * YouTube Video ID extractor
 */
function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Helper to call Telegram Bot API
 */
async function callTelegram(method: string, body: Record<string, unknown> = {}) {
  if (!TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return await res.json();
  } catch (err) {
    console.error(`Telegram API error [${method}]:`, err);
    return null;
  }
}

async function sendMessage(
  chatId: number | string,
  text: string,
  options: Record<string, unknown> = {}
) {
  return await callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...options,
  });
}

async function answerCallbackQuery(callbackQueryId: string, text = "") {
  return await callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

function isAdmin(userId: number | string): boolean {
  if (ADMIN_IDS.length === 0) return true; // Open on first setup if no whitelist specified
  return ADMIN_IDS.includes(String(userId));
}

// Persistent quick admin keyboard
const MAIN_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: "🔴 Go Live Now" }, { text: "📊 Current Status" }],
      [{ text: "⏹️ Stop Broadcast" }, { text: "📋 All Streams" }],
      [{ text: "❓ Help & Commands" }],
    ],
    resize_keyboard: true,
    persistent: true,
  },
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  // Health check on GET
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "online",
        service: "Be Fortified Christians Telegram Webhook",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const update = await req.json();

    // 1. HANDLE INLINE BUTTON CALLBACKS
    if (update.callback_query) {
      const cb = update.callback_query;
      const callbackId = cb.id;
      const data = cb.data || "";
      const chatId = cb.message?.chat?.id;
      const userId = cb.from?.id;

      if (!isAdmin(userId)) {
        await answerCallbackQuery(callbackId, "⛔ Access denied");
        return new Response("ok");
      }

      // Promote to LIVE
      if (data.startsWith("live_")) {
        const streamId = data.replace("live_", "");
        if (supabase) {
          // Use atomic procedure or fallback updates
          const { error } = await supabase.rpc("set_stream_live", { p_stream_id: streamId });
          if (error) {
            await supabase.from("streams").update({ status: "ended" }).eq("status", "live");
            await supabase.from("streams").update({ status: "live", scheduled_at: new Date().toISOString() }).eq("id", streamId);
          }
        }
        await answerCallbackQuery(callbackId, "🔴 Stream is now LIVE!");
        if (chatId) {
          await sendMessage(
            chatId,
            `🔴 <b>Broadcast Activated!</b>\nStream ID <code>${streamId}</code> is now streaming live on the website!`,
            MAIN_KEYBOARD
          );
        }
        return new Response("ok");
      }

      // Stop broadcast
      if (data.startsWith("stop_")) {
        if (supabase) {
          await supabase.rpc("end_active_stream");
        }
        await answerCallbackQuery(callbackId, "⏹️ Broadcast stopped");
        if (chatId) {
          await sendMessage(
            chatId,
            `⏹️ <b>Broadcast ended.</b>\nThe service has been archived under Previous Videos on the website.`,
            MAIN_KEYBOARD
          );
        }
        return new Response("ok");
      }

      // Delete stream
      if (data.startsWith("delete_")) {
        const streamId = data.replace("delete_", "");
        if (supabase) {
          await supabase.from("streams").delete().eq("id", streamId);
        }
        await answerCallbackQuery(callbackId, "🗑️ Deleted");
        if (chatId) {
          await sendMessage(chatId, `🗑️ Stream <code>${streamId}</code> deleted.`, MAIN_KEYBOARD);
        }
        return new Response("ok");
      }

      await answerCallbackQuery(callbackId);
      return new Response("ok");
    }

    // 2. HANDLE TEXT MESSAGES & COMMANDS
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const text = (msg.text || "").trim();

      // Check admin authorization
      if (!isAdmin(userId)) {
        await sendMessage(
          chatId,
          `⛔ <b>Access Denied</b>\n\nYour Telegram User ID (<code>${userId}</code>) is not authorized to manage the Be Fortified Christians website.\n\nAdd your ID to <code>ADMIN_TELEGRAM_IDS</code> in Supabase Secrets.`
        );
        return new Response("ok");
      }

      // Start / Help / Welcome
      if (text === "/start" || text === "/help" || text === "❓ Help & Commands") {
        const helpText =
          `🏰 <b>BE FORTIFIED CHRISTIANS — TELEGRAM CMS</b>\n\n` +
          `Welcome to the exclusive live-stream administration portal. Every command directly updates the church website in real-time.\n\n` +
          `<b>⚡ Available Commands:</b>\n` +
          `• <code>/quicklive &lt;URL&gt; &lt;Title&gt;</code> - Instantly start a live broadcast\n` +
          `• <code>/live</code> - View currently active broadcast & status\n` +
          `• <code>/stop</code> - End active live broadcast (archives it)\n` +
          `• <code>/streams</code> - View recent streams & switch between them\n` +
          `• <code>/schedule &lt;URL&gt; &lt;Title&gt;</code> - Add an upcoming service\n` +
          `• <code>/delete &lt;id&gt;</code> - Remove a stream record\n\n` +
          `<i>Your Telegram User ID:</i> <code>${userId}</code>\n` +
          `<i>Official Preacher:</i> Pastor John Jibril`;
        await sendMessage(chatId, helpText, MAIN_KEYBOARD);
        return new Response("ok");
      }

      // Instant Go-Live: /quicklive <URL> <Title>
      if (text.startsWith("/quicklive") || text === "🔴 Go Live Now") {
        const parts = text.split(" ");
        if (parts.length < 3) {
          await sendMessage(
            chatId,
            `🔴 <b>Instant Live Broadcast</b>\n\n` +
              `Send the command formatted like this:\n` +
              `<code>/quicklive &lt;YouTube_URL&gt; &lt;Service Title&gt;</code>\n\n` +
              `<b>Example:</b>\n` +
              `<code>/quicklive https://youtu.be/kJQP7kiw5Fk Sunday Special with Pastor John Jibril</code>`,
            MAIN_KEYBOARD
          );
          return new Response("ok");
        }

        const url = parts[1];
        const title = parts.slice(2).join(" ");
        const videoId = extractYouTubeId(url);

        if (!videoId) {
          await sendMessage(
            chatId,
            `⚠️ <b>Invalid YouTube Link</b>\nPlease provide a valid YouTube URL (e.g. <code>https://youtube.com/watch?v=...</code> or <code>https://youtu.be/...</code>).`
          );
          return new Response("ok");
        }

        const streamId = "stream_" + Date.now();
        const newStream = {
          id: streamId,
          title,
          description: "Sunday Special live broadcast with Pastor John Jibril.",
          youtube_url: url,
          youtube_video_id: videoId,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          speaker: "Pastor John Jibril",
          speaker_title: "Lead Pastor",
          status: "live",
          scheduled_at: new Date().toISOString(),
          viewer_count: 180,
          tags: ["Sunday Special", "Pastor John Jibril", "Live Broadcast"],
        };

        if (supabase) {
          // Demote any active live streams first
          await supabase.from("streams").update({ status: "ended" }).eq("status", "live");
          // Insert the new live stream
          const { error } = await supabase.from("streams").insert(newStream);
          if (error) {
            console.error("Supabase insert error:", error);
            await sendMessage(chatId, `⚠️ Database sync error: ${error.message}`);
            return new Response("ok");
          }
        }

        await sendMessage(
          chatId,
          `🎉 <b>LIVE BROADCAST IS NOW ON AIR!</b>\n\n` +
            `<b>Title:</b> ${title}\n` +
            `<b>Minister:</b> Pastor John Jibril\n` +
            `<b>YouTube ID:</b> <code>${videoId}</code>\n` +
            `<b>Watch Link:</b> https://youtu.be/${videoId}\n\n` +
            `<i>The website cinema player is now actively streaming this video to all viewers!</i>`,
          MAIN_KEYBOARD
        );
        return new Response("ok");
      }

      // Schedule Upcoming Service: /schedule <URL> <Title>
      if (text.startsWith("/schedule")) {
        const parts = text.split(" ");
        if (parts.length < 3) {
          await sendMessage(
            chatId,
            `📅 <b>Schedule Upcoming Service</b>\n\n` +
              `Format:\n<code>/schedule &lt;YouTube_URL&gt; &lt;Service Title&gt;</code>\n\n` +
              `<b>Example:</b>\n<code>/schedule https://youtu.be/kJQP7kiw5Fk Next Sunday Special</code>`,
            MAIN_KEYBOARD
          );
          return new Response("ok");
        }

        const url = parts[1];
        const title = parts.slice(2).join(" ");
        const videoId = extractYouTubeId(url);

        if (!videoId) {
          await sendMessage(chatId, "⚠️ Invalid YouTube link. Please check and try again.");
          return new Response("ok");
        }

        const streamId = "stream_" + Date.now();
        const nextSunday = new Date();
        nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
        nextSunday.setHours(14, 0, 0, 0); // 2:00 PM

        const upcomingStream = {
          id: streamId,
          title,
          description: "Join Pastor John Jibril for the Sunday Special Online Service.",
          youtube_url: url,
          youtube_video_id: videoId,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          speaker: "Pastor John Jibril",
          speaker_title: "Lead Pastor",
          status: "upcoming",
          scheduled_at: nextSunday.toISOString(),
          viewer_count: 0,
          tags: ["Sunday Special", "Upcoming", "Pastor John Jibril"],
        };

        if (supabase) {
          await supabase.from("streams").insert(upcomingStream);
        }

        await sendMessage(
          chatId,
          `🟡 <b>Upcoming Service Scheduled!</b>\n\n` +
            `<b>Title:</b> ${title}\n` +
            `<b>Scheduled For:</b> ${nextSunday.toUTCString()}\n` +
            `<b>Speaker:</b> Pastor John Jibril\n\n` +
            `<i>This service is now listed under 'Upcoming Services' on the website with a live countdown!</i>`,
          MAIN_KEYBOARD
        );
        return new Response("ok");
      }

      // Status Check: /live
      if (text === "/live" || text === "📊 Current Status") {
        if (!supabase) {
          await sendMessage(chatId, "⚠️ Supabase client is not initialized.", MAIN_KEYBOARD);
          return new Response("ok");
        }

        const { data } = await supabase
          .from("streams")
          .select("*")
          .eq("status", "live")
          .maybeSingle();

        if (!data) {
          await sendMessage(
            chatId,
            `ℹ️ <b>No stream is currently LIVE.</b>\n\nUse <code>/quicklive &lt;URL&gt; &lt;Title&gt;</code> to go on air.`,
            MAIN_KEYBOARD
          );
        } else {
          await sendMessage(
            chatId,
            `🔴 <b>CURRENTLY STREAMING LIVE:</b>\n\n` +
              `<b>${data.title}</b>\n` +
              `Speaker: ${data.speaker} (${data.speaker_title || "Lead Pastor"})\n` +
              `Viewers: ~${data.viewer_count || 120}\n` +
              `YouTube Link: https://youtu.be/${data.youtube_video_id}\n\n` +
              `<i>Stream ID:</i> <code>${data.id}</code>`,
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "⏹️ End Live Broadcast", callback_data: `stop_${data.id}` }],
                ],
              },
            }
          );
        }
        return new Response("ok");
      }

      // Stop Broadcast: /stop
      if (text === "/stop" || text === "/endlive" || text === "⏹️ Stop Broadcast") {
        if (!supabase) {
          await sendMessage(chatId, "⚠️ Supabase is not connected.", MAIN_KEYBOARD);
          return new Response("ok");
        }

        const { error } = await supabase.rpc("end_active_stream");
        if (error) {
          await supabase.from("streams").update({ status: "ended" }).eq("status", "live");
        }

        await sendMessage(
          chatId,
          `⏹️ <b>Live broadcast has ended.</b>\n\nThe recording has been automatically transferred into Previous Videos on the church website.`,
          MAIN_KEYBOARD
        );
        return new Response("ok");
      }

      // List Streams: /streams
      if (text === "/streams" || text === "📋 All Streams") {
        if (!supabase) {
          await sendMessage(chatId, "⚠️ Supabase is not connected.", MAIN_KEYBOARD);
          return new Response("ok");
        }

        const { data } = await supabase
          .from("streams")
          .select("id, title, status, speaker, scheduled_at")
          .order("scheduled_at", { ascending: false })
          .limit(6);

        if (!data || data.length === 0) {
          await sendMessage(chatId, "No streams found in the database.", MAIN_KEYBOARD);
          return new Response("ok");
        }

        let catalogue = `📋 <b>Website Stream Library:</b>\n\n`;
        const buttons = [];

        data.forEach((s: Record<string, unknown>, idx: number) => {
          const badge =
            s.status === "live"
              ? "🔴 LIVE"
              : s.status === "upcoming"
              ? "🟡 UPCOMING"
              : "▶️ PREVIOUS";
          catalogue += `${idx + 1}. [${badge}] <b>${s.title}</b>\nID: <code>${s.id}</code>\n\n`;

          if (s.status !== "live") {
            buttons.push([
              { text: `🔴 Make #${idx + 1} LIVE`, callback_data: `live_${s.id}` },
              { text: `🗑️ Del #${idx + 1}`, callback_data: `delete_${s.id}` },
            ]);
          }
        });

        await sendMessage(chatId, catalogue, {
          reply_markup: {
            inline_keyboard: buttons,
          },
        });
        return new Response("ok");
      }

      // Delete Stream: /delete <id>
      if (text.startsWith("/delete")) {
        const streamId = text.replace("/delete", "").trim();
        if (!streamId) {
          await sendMessage(chatId, `Usage: <code>/delete &lt;stream_id&gt;</code>`);
          return new Response("ok");
        }
        if (supabase) {
          await supabase.from("streams").delete().eq("id", streamId);
        }
        await sendMessage(chatId, `🗑️ Stream <code>${streamId}</code> was deleted from database.`, MAIN_KEYBOARD);
        return new Response("ok");
      }
    }

    return new Response("ok");
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response("Error", { status: 500 });
  }
});
