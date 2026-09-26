import { useState } from 'react';
import type { Stream } from '../types/stream';
import { StreamCard } from './StreamCard';
import { Search, History, X, Film } from 'lucide-react';

interface PreviousArchiveProps {
  previousStreams: Stream[];
  onSelectStream: (stream: Stream) => void;
}

export const PreviousArchive: React.FC<PreviousArchiveProps> = ({
  previousStreams,
  onSelectStream
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = previousStreams.filter(stream => {
    const query = searchQuery.toLowerCase();
    return (
      stream.title.toLowerCase().includes(query) ||
      stream.speaker.toLowerCase().includes(query) ||
      (stream.description && stream.description.toLowerCase().includes(query)) ||
      (stream.scripture && stream.scripture.toLowerCase().includes(query))
    );
  });

  return (
    <section className="container" style={{ paddingBottom: '64px' }}>
      <div className="section-header" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="section-title-wrap">
          <span className="section-pretitle">Sermon Archives</span>
          <h2 className="section-title">Previous Videos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
            Check out our previous videos here.
          </p>
        </div>

        {/* Search Bar - only show if there are previous streams */}
        {previousStreams.length > 0 && (
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', paddingRight: searchQuery ? '36px' : '16px', borderRadius: 'var(--radius-full)' }}
              placeholder="Search past sermons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {previousStreams.length === 0 ? (
        <div className="empty-state-box">
          <Film size={36} color="var(--blue-600)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--blue-950)', marginBottom: '6px' }}>
            No previous videos available
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
            There are no past video recordings available yet. Live broadcasts will automatically be recorded and archived here once concluded.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-box">
          <History size={36} color="var(--blue-600)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--blue-950)', marginBottom: '6px' }}>
            No matching videos found
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Try searching with a different preacher name or keyword.
          </p>
        </div>
      ) : (
        <div className="stream-grid">
          {filtered.map(stream => (
            <StreamCard key={stream.id} stream={stream} onSelect={onSelectStream} />
          ))}
        </div>
      )}
    </section>
  );
};
