import { useState, useEffect, useRef } from 'react';
import type { Stream, PrayerRequest } from '../types/stream';
import { getYouTubeEmbedUrl, formatStreamDate, downloadCalendarInvite } from '../lib/youtube';
import { Radio, Users, Calendar, Share2, BookOpen, Maximize2, Minimize2, Check, Send, Play } from 'lucide-react';

interface HeroLiveStreamProps {
  stream: Stream | null;
  onOpenPrayer: () => void;
  onOpenGiving: () => void;
  prayers?: PrayerRequest[];
  onAddPrayer?: (name: string, request: string) => void;
}

interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  isReaction?: boolean;
  emoji?: string;
}

interface FloatingEmoji {
  id: number;
  left: number;
  emoji: string;
}

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'c-1',
    name: 'Sister Mary K.',
    message: 'Amen! The Lord is our fortress and strength! 🙏',
    timestamp: '2m ago'
  },
  {
    id: 'c-2',
    name: 'Brother Caleb',
    message: 'Watching live from London. Standing in faith with Pastor John Jibril! 🔥',
    timestamp: '1m ago'
  },
  {
    id: 'c-3',
    name: 'Grace O.',
    message: 'Praying for total healing and restoration for all families today.',
    timestamp: 'Just now'
  }
];

function getStoredUserName(): string {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )bf_user_name=([^;]*)/);
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bf_user_name') || '';
  }
  return '';
}

function saveStoredUserName(name: string) {
  const trimmed = name.trim();
  if (typeof document !== 'undefined') {
    document.cookie = `bf_user_name=${encodeURIComponent(trimmed)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('bf_user_name', trimmed);
  }
}

export const HeroLiveStream: React.FC<HeroLiveStreamProps> = ({
  stream,
  onOpenPrayer,
  prayers = [],
  onAddPrayer
}) => {
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    '❤️': 188,
    '🙏': 288,
    '🔥': 95,
    '🙌': 173,
    '✝️': 204
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const prayerMessages: ChatMessage[] = prayers.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      message: p.request,
      timestamp: p.created_at
    }));
    return [...INITIAL_CHAT_MESSAGES, ...prayerMessages];
  });

  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [inputText, setInputText] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [theaterMode, setTheaterMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsPlaying(false);
  }, [stream?.id, stream?.youtube_video_id]);

  const scrollChatFeedToBottom = () => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Synchronize fullscreen state with browser events
  useEffect(() => {
    const onFsChange = () => {
      setTheaterMode(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    const cardEl = document.getElementById('hero-theater-card');
    if (!document.fullscreenElement) {
      if (cardEl?.requestFullscreen) {
        cardEl.requestFullscreen().catch(() => {
          setTheaterMode(prev => !prev);
        });
      } else {
        setTheaterMode(prev => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setTheaterMode(false);
    }
  };

  // Countdown timer calculation for upcoming streams
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!stream || stream.status !== 'upcoming') return;

    const calculateTime = () => {
      const target = new Date(stream.scheduled_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [stream]);

  // Sync new incoming prayers to chat
  useEffect(() => {
    if (prayers.length > 0) {
      const latestPrayer = prayers[0];
      setChatMessages(prev => {
        if (prev.some(m => m.id === latestPrayer.id)) return prev;
        return [
          ...prev,
          {
            id: latestPrayer.id,
            name: latestPrayer.name,
            message: latestPrayer.request,
            timestamp: latestPrayer.created_at
          }
        ];
      });
    }
  }, [prayers]);

  const triggerFloatingEmoji = (emoji: string) => {
    const newItems: FloatingEmoji[] = [
      { id: Date.now() + Math.random(), left: Math.floor(Math.random() * 65) + 15, emoji },
      { id: Date.now() + Math.random() + 1, left: Math.floor(Math.random() * 65) + 15, emoji }
    ];

    setFloatingEmojis(prev => [...prev, ...newItems]);

    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => !newItems.some(n => n.id === item.id)));
    }, 1800);
  };

  const handleReaction = (emoji: string) => {
    setReactions(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }));

    triggerFloatingEmoji(emoji);

    const storedName = getStoredUserName();
    const sender = storedName || 'A Believer';
    const reactionNotice: ChatMessage = {
      id: 'reaction-' + Date.now(),
      name: sender,
      message: `sent ${emoji} praise & agreement!`,
      timestamp: 'Just now',
      isReaction: true,
      emoji
    };

    setChatMessages(prev => [...prev, reactionNotice]);
    setTimeout(() => {
      scrollChatFeedToBottom();
    }, 50);
  };

  const executeSendMessage = (authorName: string, text: string) => {
    const newChat: ChatMessage = {
      id: 'msg-' + Date.now(),
      name: authorName,
      message: text,
      timestamp: 'Just now'
    };

    setChatMessages(prev => [...prev, newChat]);

    // Also register into global prayer wall!
    if (onAddPrayer) {
      onAddPrayer(authorName, text);
    }

    triggerFloatingEmoji('🙏');

    setTimeout(() => {
      scrollChatFeedToBottom();
    }, 50);
  };

  const handleAttemptSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const storedName = getStoredUserName();
    if (!storedName) {
      // Prompt user with name pop-up modal
      setPendingMessage(text);
      setShowNameModal(true);
      return;
    }

    // Name exists in cookie/storage! Send immediately
    executeSendMessage(storedName, text);
    setInputText('');
  };

  const handleSaveNameAndSend = (e: React.FormEvent) => {
    e.preventDefault();
    const name = tempName.trim();
    if (!name) return;

    saveStoredUserName(name);
    setShowNameModal(false);

    if (pendingMessage) {
      executeSendMessage(name, pendingMessage);
      setInputText('');
      setPendingMessage('');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: stream?.title || 'Be Fortified Christians Live',
        text: `Watch '${stream?.title}' on Be Fortified Christians Network Live!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!stream) {
    return (
      <section className="hero-stream-section container">
        <div className="hero-theater-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Radio size={48} color="#D97706" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>No Broadcast Currently Active</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 24px' }}>
            There is no live stream running right now. Explore upcoming service schedules or watch past sermon archives below.
          </p>
        </div>
      </section>
    );
  }

  const isLive = stream.status === 'live';
  const isUpcoming = stream.status === 'upcoming';

  return (
    <section className="hero-stream-section container" id="main-player">
      <div id="hero-theater-card" className={`hero-theater-card ${theaterMode ? 'theater-mode-expanded' : ''}`}>
        {/* Top Bar with Live Indicator and Viewer Count */}
        <div className="theater-top-bar">
          <div className="theater-top-left">
            {isLive ? (
              <span className="live-badge">
                <span className="live-dot" /> LIVE STREAMING NOW
              </span>
            ) : isUpcoming ? (
              <span className="badge-upcoming">
                <Calendar size={14} /> UPCOMING BROADCAST
              </span>
            ) : (
              <span className="badge-ended">
                ▶️ RECORDED SERVICE
              </span>
            )}

            {isLive && stream.viewer_count && (
              <span className="viewer-counter">
                <Users size={14} color="#DC2626" />
                <span>{stream.viewer_count.toLocaleString()} watching</span>
              </span>
            )}
          </div>

          <div className="theater-top-right">
            <button
              className="btn btn-outline btn-sm"
              onClick={handleShare}
              title="Share Stream"
            >
              {copied ? <Check size={14} color="#16A34A" /> : <Share2 size={14} />}
              <span>{copied ? 'Link Copied' : 'Share'}</span>
            </button>

            <button
              className="btn btn-outline btn-sm"
              onClick={handleToggleFullscreen}
              title={theaterMode ? 'Exit Fullscreen' : 'Fullscreen / Cinema View'}
            >
              {theaterMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{theaterMode ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Video Player or Upcoming Banner */}
        <div className="video-player-container">
          {isLive || stream.status === 'ended' ? (
            isPlaying ? (
              <div className="player-iframe-wrapper">
                <iframe
                  src={getYouTubeEmbedUrl(stream.youtube_video_id, { autoplay: true })}
                  title={stream.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div
                className="video-poster-preview"
                style={{ backgroundImage: `url(${stream.thumbnail_url || '/sunday-special-flyer-updated.png'})` }}
                onClick={() => setIsPlaying(true)}
              >
                <div className="video-poster-overlay">
                  {isLive && (
                    <span className="live-badge" style={{ marginBottom: '16px', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.5)' }}>
                      <span className="live-dot" /> LIVE STREAMING NOW
                    </span>
                  )}
                  <div className="play-pulse-circle">
                    <Play size={40} fill="white" color="white" style={{ marginLeft: '4px' }} />
                  </div>
                  <h3 className="poster-title-text">{stream.title}</h3>
                  <span className="poster-play-prompt">
                    Click to Start Watching {isLive ? 'Live Service' : 'Broadcast'}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div
              className="video-upcoming-placeholder"
              style={{ backgroundImage: `url(${stream.thumbnail_url || '/sunday-special-flyer-updated.png'})` }}
            >
              <div className="video-upcoming-overlay">
                <span className="badge-upcoming" style={{ marginBottom: '16px' }}>
                  <Calendar size={14} /> Scheduled for {formatStreamDate(stream.scheduled_at)}
                </span>
                <h3 style={{ fontSize: '1.85rem', color: 'white', maxWidth: '700px', marginBottom: '12px' }}>
                  {stream.title}
                </h3>
                <p style={{ color: '#E2E8F0', marginBottom: '24px', fontSize: '1.05rem' }}>
                  with {stream.speaker} {stream.speaker_title ? `(${stream.speaker_title})` : ''}
                </p>

                {/* Countdown Display */}
                <div className="countdown-box">
                  <div className="countdown-unit">
                    <span className="countdown-number">{timeLeft.days}</span>
                    <span className="countdown-label">Days</span>
                  </div>
                  <span className="countdown-divider">:</span>
                  <div className="countdown-unit">
                    <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="countdown-label">Hours</span>
                  </div>
                  <span className="countdown-divider">:</span>
                  <div className="countdown-unit">
                    <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="countdown-label">Mins</span>
                  </div>
                  <span className="countdown-divider">:</span>
                  <div className="countdown-unit">
                    <span className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="countdown-label">Secs</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    className="btn btn-gold"
                    onClick={() => downloadCalendarInvite(stream)}
                  >
                    <Calendar size={16} />
                    <span>Add to Calendar (.ics)</span>
                  </button>

                  <button
                    className="btn btn-outline"
                    style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                    onClick={onOpenPrayer}
                  >
                    <span>Submit Prayer Request</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stream Details & Interactive Fellowship Sidebar */}
        <div className="theater-details">
          {/* Column 1: Sermon Information & Scripture */}
          <div>
            <h1 className="stream-title-large">{stream.title}</h1>

            <div className="speaker-meta-row">
              <span className="speaker-pill">
                <span>👤</span>
                <span>{stream.speaker}</span>
                {stream.speaker_title && <span style={{ color: 'var(--text-muted)' }}>• {stream.speaker_title}</span>}
              </span>
              <span>•</span>
              <span>{formatStreamDate(stream.scheduled_at)}</span>
            </div>

            {stream.scripture && (
              <div className="scripture-box">
                <div className="scripture-label">
                  <BookOpen size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Scripture Reading
                </div>
                <div className="scripture-quote">"{stream.scripture}"</div>
              </div>
            )}

            <p className="stream-desc-text">{stream.description}</p>

            {/* Tags */}
            {stream.tags && stream.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {stream.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--blue-50)',
                      color: 'var(--blue-800)',
                      border: '1px solid var(--border-blue)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Non-blocking Live Fellowship & Prayer Stream */}
          <div className="theater-sidebar-box">
            {/* Floating Animated Hearts & Emojis */}
            <div className="floating-hearts-container" aria-hidden="true">
              {floatingEmojis.map(item => (
                <span
                  key={item.id}
                  className="floating-heart"
                  style={{ left: `${item.left}%` }}
                >
                  {item.emoji}
                </span>
              ))}
            </div>

            {/* Chat & Fellowship Header */}
            <div className="chat-header-row">
              <div className="chat-header-title">
                <span>💬</span>
                <span>Live Fellowship &amp; Prayers</span>
              </div>
              <span className="chat-live-badge">
                <span className="live-dot" /> LIVE
              </span>
            </div>

            {/* Quick Action Reactions Row featuring Giant Love Button */}
            <div className="live-reaction-action-row">
              <button
                className="love-btn-pulse"
                onClick={() => handleReaction('❤️')}
                title="Send Love & Praise to Stream"
              >
                <span>❤️</span>
                <span>Love ({reactions['❤️']})</span>
              </button>

              <div className="quick-emojis-row">
                <button
                  className="emoji-pill-btn"
                  onClick={() => handleReaction('🙏')}
                  title="Praying in agreement"
                >
                  <span>🙏</span>
                  <span>{reactions['🙏']}</span>
                </button>

                <button
                  className="emoji-pill-btn"
                  onClick={() => handleReaction('🔥')}
                  title="Holy Ghost Fire"
                >
                  <span>🔥</span>
                  <span>{reactions['🔥']}</span>
                </button>

                <button
                  className="emoji-pill-btn"
                  onClick={() => handleReaction('🙌')}
                  title="Praise God"
                >
                  <span>🙌</span>
                  <span>{reactions['🙌']}</span>
                </button>

                <button
                  className="emoji-pill-btn"
                  onClick={() => handleReaction('✝️')}
                  title="Faith in Christ"
                >
                  <span>✝️</span>
                  <span>{reactions['✝️']}</span>
                </button>
              </div>
            </div>

            {/* Live Chat & Prayer Feed */}
            <div className="live-chat-feed" ref={chatFeedRef}>
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`live-chat-item ${msg.isReaction ? 'is-reaction' : ''}`}
                >
                  {!msg.isReaction && (
                    <div className="chat-avatar-bubble">
                      {msg.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="chat-content-col">
                    <div className="chat-author-line">
                      <span className="chat-author-name">{msg.name}</span>
                      <span className="chat-timestamp">{msg.timestamp}</span>
                    </div>
                    <div className="chat-message-text">
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Non-Blocking Chat & Prayer Input Form with ONE BIG SEND BUTTON */}
            <form onSubmit={handleAttemptSend} className="chat-input-container">
              <input
                type="text"
                placeholder="Type your prayer, 'Amen!' or praise..."
                className="chat-input-full"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" className="btn-big-send">
                <Send size={16} />
                <span>Send Prayer &amp; Praise</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Name Pop-up Modal (Only asks on first submit if cookie/storage doesn't have name) */}
      {showNameModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowNameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🙏</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue-950)', marginBottom: '6px' }}>
                What is your name?
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Please enter your name to post your prayer or testimony. It will be saved in your browser cookies so you won't be asked again.
              </p>
            </div>

            <form onSubmit={handleSaveNameAndSend}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Your Name / Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sister Grace / Brother David"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  required
                  style={{ fontSize: '1rem', padding: '14px 16px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowNameModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  <span>Continue &amp; Post</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
