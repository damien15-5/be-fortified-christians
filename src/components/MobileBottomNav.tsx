import React from 'react';
import { Home, Radio, Calendar, History, Heart } from 'lucide-react';
import type { Stream } from '../types/stream';

interface MobileBottomNavProps {
  currentTab: 'home' | 'live' | 'upcoming' | 'previous';
  setCurrentTab: (tab: 'home' | 'live' | 'upcoming' | 'previous') => void;
  liveStream: Stream | null;
  onOpenGiving: () => void;
  onOpenPrayer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  liveStream,
  onOpenGiving,
  onOpenPrayer,
}) => {
  const handleNav = (tab: 'home' | 'live' | 'upcoming' | 'previous') => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="mobile-bottom-dock" aria-label="Mobile Bottom Navigation">
      <div className="mobile-dock-inner">
        {/* Home */}
        <button
          className={`dock-item ${currentTab === 'home' ? 'active' : ''}`}
          onClick={() => handleNav('home')}
          aria-label="Home"
        >
          <div className="dock-icon-wrap">
            <Home size={20} />
          </div>
          <span className="dock-label">Home</span>
        </button>

        {/* Live */}
        <button
          className={`dock-item dock-item-live ${currentTab === 'live' ? 'active' : ''}`}
          onClick={() => handleNav('live')}
          aria-label="Watch Live"
        >
          <div className="dock-icon-wrap live-glow-wrap">
            <Radio size={20} />
            {liveStream && <span className="dock-live-dot" />}
          </div>
          <span className="dock-label">
            {liveStream ? 'Live' : 'Live'}
          </span>
        </button>

        {/* Upcoming */}
        <button
          className={`dock-item ${currentTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleNav('upcoming')}
          aria-label="Upcoming"
        >
          <div className="dock-icon-wrap">
            <Calendar size={20} />
          </div>
          <span className="dock-label">Upcoming</span>
        </button>

        {/* Previous */}
        <button
          className={`dock-item ${currentTab === 'previous' ? 'active' : ''}`}
          onClick={() => handleNav('previous')}
          aria-label="Previous Videos"
        >
          <div className="dock-icon-wrap">
            <History size={20} />
          </div>
          <span className="dock-label">Previous</span>
        </button>

        {/* Prayer Wall */}
        <button
          className="dock-item"
          onClick={onOpenPrayer}
          aria-label="Submit Prayer Request"
        >
          <div className="dock-icon-wrap">
            <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>🙏</span>
          </div>
          <span className="dock-label">Prayer</span>
        </button>

        {/* Giving */}
        <button
          className="dock-item dock-item-gold"
          onClick={onOpenGiving}
          aria-label="Giving"
        >
          <div className="dock-icon-wrap">
            <Heart size={20} fill="currentColor" />
          </div>
          <span className="dock-label">Giving</span>
        </button>
      </div>
    </nav>
  );
};
