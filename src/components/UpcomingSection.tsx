import type { Stream } from '../types/stream';
import { StreamCard } from './StreamCard';
import { VideoOff } from 'lucide-react';

interface UpcomingSectionProps {
  upcomingStreams: Stream[];
  onSelectStream: (stream: Stream) => void;
}

export const UpcomingSection: React.FC<UpcomingSectionProps> = ({
  upcomingStreams,
  onSelectStream
}) => {
  return (
    <section className="container" style={{ paddingBottom: '48px' }}>
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div className="section-title-wrap">
          <span className="section-pretitle">Broadcast Schedule</span>
          <h2 className="section-title">Upcoming Videos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
            Check out the upcoming videos here.
          </p>
        </div>
      </div>

      {upcomingStreams.length === 0 ? (
        <div className="empty-state-box">
          <VideoOff size={36} color="var(--gold-600)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--blue-950)', marginBottom: '6px' }}>
            No upcoming videos available
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
            No upcoming broadcasts have been scheduled yet. Join us for our weekly Sunday Special at 2:00 PM (GMT+1) or stay tuned for updates!
          </p>
        </div>
      ) : (
        <div className="stream-grid">
          {upcomingStreams.map(stream => (
            <StreamCard key={stream.id} stream={stream} onSelect={onSelectStream} />
          ))}
        </div>
      )}
    </section>
  );
};
