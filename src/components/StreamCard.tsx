import type { Stream } from '../types/stream';
import { formatStreamDate, getCountdown, downloadCalendarInvite } from '../lib/youtube';
import { Play, Calendar, Clock, User, Download } from 'lucide-react';

interface StreamCardProps {
  stream: Stream;
  onSelect: (stream: Stream) => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, onSelect }) => {
  const isLive = stream.status === 'live';
  const isUpcoming = stream.status === 'upcoming';
  const countdown = isUpcoming ? getCountdown(stream.scheduled_at) : null;

  return (
    <article
      className="stream-card"
      onClick={() => onSelect(stream)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(stream);
        }
      }}
    >
      {/* Thumbnail Area */}
      <div className="card-thumbnail-wrap">
        <img
          src={stream.thumbnail_url || '/sunday-special-flyer-updated.png'}
          alt={stream.title}
          className="card-thumbnail-img"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/sunday-special-flyer-updated.png';
          }}
        />

        {/* Status Badge */}
        <div className="card-badge-overlay">
          {isLive ? (
            <span className="live-badge">
              <span className="live-dot" /> LIVE
            </span>
          ) : isUpcoming ? (
            <span className="badge-upcoming">
              <Calendar size={12} /> UPCOMING
            </span>
          ) : (
            <span className="badge-ended">
              ▶️ RECORDING
            </span>
          )}
        </div>

        {/* Hover Play Circle */}
        <div className="card-play-overlay">
          <div className="play-circle-btn">
            <Play size={24} fill="currentColor" style={{ marginLeft: '3px' }} />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="card-body">
        <div className="card-meta-line">
          <Clock size={13} />
          <span>{formatStreamDate(stream.scheduled_at)}</span>
          {countdown && !countdown.isPast && (
            <span style={{ color: 'var(--gold-600)', fontWeight: 700, marginLeft: 'auto' }}>
              {countdown.text}
            </span>
          )}
        </div>

        <h3 className="card-title" title={stream.title}>
          {stream.title}
        </h3>

        <div className="card-speaker">
          <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
          {stream.speaker}
        </div>

        <div className="card-footer">
          {isLive ? (
            <span style={{ color: '#DC2626', fontWeight: 800, fontSize: '0.86rem' }}>
              🔴 Watch Live Now →
            </span>
          ) : isUpcoming ? (
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--gold-700)', fontWeight: 700, fontSize: '0.86rem' }}>
                View Schedule →
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadCalendarInvite(stream);
                }}
                title="Add to Calendar"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Download size={12} />
                <span>.ICS</span>
              </button>
            </div>
          ) : (
            <span style={{ color: 'var(--blue-700)', fontWeight: 700, fontSize: '0.86rem' }}>
              Watch Sermon Replay →
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
