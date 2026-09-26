import React from 'react';
import { MapPin, Mail, Play } from 'lucide-react';

interface FooterProps {
  onNav: (tab: 'home' | 'live' | 'upcoming' | 'previous') => void;
  onOpenPrayer: () => void;
  onOpenGiving: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNav, onOpenPrayer, onOpenGiving }) => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info & Motto */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <img
                src="/church_logo.jpg"
                alt="Be Fortified Christians"
                style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(245, 158, 11, 0.4)' }}
              />
              <div>
                <h3 className="footer-brand-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                  BE_FORTIFIED
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--gold-400)', fontWeight: 700, letterSpacing: '0.06em' }}>
                  CHRISTIANS GLOBAL NETWORK
                </span>
              </div>
            </div>

            {/* Official Church Creed / Motto from the Logo */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderLeft: '3px solid var(--gold-500)',
                padding: '10px 14px',
                borderRadius: '0 8px 8px 0',
                margin: '14px 0 16px',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.8rem',
                color: '#FDE68A',
                letterSpacing: '0.04em',
                lineHeight: 1.5
              }}
            >
              "BEFORTIFIED IN YOUR MIND,
              <br />
              BEFORTIFIED IN YOUR RESOLVE,
              <br />
              BEFORTIFIED IN YOUR POSITION."
            </div>

            <p className="footer-text">
              Equipping believers with the word of truth, faith, and spiritual strength with Pastor John Jibril. Watch live broadcasts, access anointed sermon archives, and join our global online fellowship.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  transition: 'background var(--transition-fast)'
                }}
                title="Watch on YouTube"
              >
                <Play size={16} fill="white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-heading">Network Links</h4>
            <ul className="footer-links">
              <li>
                <button className="footer-link" onClick={() => onNav('home')}>
                  Home Network
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={() => onNav('live')}>
                  Watch Live Broadcast
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={() => onNav('upcoming')}>
                  Upcoming Services
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={() => onNav('previous')}>
                  Previous Videos
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={onOpenPrayer}>
                  Submit Prayer Request
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={onOpenGiving}>
                  Online Giving &amp; Tithes
                </button>
              </li>
            </ul>
          </div>

          {/* Service Times */}
          <div>
            <h4 className="footer-heading">Weekly Services</h4>
            <ul className="footer-links" style={{ fontSize: '0.88rem' }}>
              <li>
                <strong style={{ color: 'white' }}>Sunday Special Online:</strong>
                <div style={{ color: 'var(--gold-400)' }}>Every Sunday • 2:00 PM (GMT+1)</div>
                <div style={{ fontSize: '0.76rem', color: '#CBD5E1' }}>with Pastor John Jibril</div>
              </li>
              <li style={{ marginTop: '8px' }}>
                <strong style={{ color: 'white' }}>Midweek Word &amp; Power:</strong>
                <div style={{ color: 'var(--gold-400)' }}>Wednesday • 6:30 PM (GMT+1)</div>
              </li>
              <li style={{ marginTop: '8px' }}>
                <strong style={{ color: 'white' }}>Global Prayer &amp; Vigils:</strong>
                <div style={{ color: 'var(--gold-400)' }}>Monthly Broadcasts</div>
              </li>
            </ul>
          </div>

          {/* Fellowship & Contact */}
          <div>
            <h4 className="footer-heading">Fellowship &amp; Contact</h4>
            <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.5, marginBottom: '14px' }}>
              Connect with our pastoral and prayer team for spiritual counsel and ministry support.
            </p>

            <div style={{ fontSize: '0.84rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="var(--gold-400)" />
                <span>info@befortified.org</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--gold-400)" />
                <span>Global Online Campus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} Be Fortified Christians. All rights reserved. Powered by YouTube Streaming.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Ephesians 6:10</span>
            <span>•</span>
            <span style={{ color: 'var(--gold-400)' }}>Fortified In Christ</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
