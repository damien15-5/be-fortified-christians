import { useState } from 'react';
import { Radio, Calendar, History, Heart, Menu, X } from 'lucide-react';
import type { Stream } from '../types/stream';

interface NavbarProps {
  currentTab: 'home' | 'live' | 'upcoming' | 'previous';
  setCurrentTab: (tab: 'home' | 'live' | 'upcoming' | 'previous') => void;
  liveStream: Stream | null;
  onOpenGiving: () => void;
  onOpenPrayer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  liveStream,
  onOpenGiving,
  onOpenPrayer
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navTo = (tab: 'home' | 'live' | 'upcoming' | 'previous') => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="navbar-wrapper">
      <div className="container">
        <nav className="navbar" aria-label="Main Navigation">
          {/* Brand Logo & Name */}
          <a
            href="#home"
            className="brand-link"
            onClick={(e) => {
              e.preventDefault();
              navTo('home');
            }}
          >
            <img
              src="/church_logo.jpg"
              alt="Be Fortified Christians Logo"
              className="brand-logo-img"
            />
            <div className="brand-text-col">
              <span className="brand-title">BE_FORTIFIED</span>
              <span className="brand-subtitle">CHRISTIANS NETWORK</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="nav-links-desktop">
            <button
              className={`nav-item ${currentTab === 'home' ? 'active' : ''}`}
              onClick={() => navTo('home')}
            >
              <span>Home</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'live' ? 'active' : ''}`}
              onClick={() => navTo('live')}
            >
              <Radio size={15} color={liveStream ? '#DC2626' : 'currentColor'} />
              <span>Watch Live</span>
              {liveStream && (
                <span className="nav-live-pill">
                  <span className="live-dot" /> LIVE
                </span>
              )}
            </button>

            <button
              className={`nav-item ${currentTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => navTo('upcoming')}
            >
              <Calendar size={15} />
              <span>Upcoming</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'previous' ? 'active' : ''}`}
              onClick={() => navTo('previous')}
            >
              <History size={15} />
              <span>Previous Videos</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="nav-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={onOpenPrayer}
              title="Submit a prayer request"
            >
              🙏 Prayer
            </button>

            <button
              className="btn btn-gold btn-sm"
              onClick={onOpenGiving}
            >
              <Heart size={14} />
              <span>Giving</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-nav-menu">
            <button
              className={`mobile-nav-item ${currentTab === 'home' ? 'active' : ''}`}
              onClick={() => navTo('home')}
            >
              <span>Home</span>
            </button>

            <button
              className={`mobile-nav-item ${currentTab === 'live' ? 'active' : ''}`}
              onClick={() => navTo('live')}
            >
              <Radio size={16} color={liveStream ? '#DC2626' : 'currentColor'} />
              <span>Watch Live</span>
              {liveStream && (
                <span className="nav-live-pill" style={{ marginLeft: 'auto' }}>
                  <span className="live-dot" /> LIVE
                </span>
              )}
            </button>

            <button
              className={`mobile-nav-item ${currentTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => navTo('upcoming')}
            >
              <Calendar size={16} />
              <span>Upcoming Videos</span>
            </button>

            <button
              className={`mobile-nav-item ${currentTab === 'previous' ? 'active' : ''}`}
              onClick={() => navTo('previous')}
            >
              <History size={16} />
              <span>Previous Videos</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
