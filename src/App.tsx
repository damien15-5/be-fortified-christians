import { useState, useEffect } from 'react';
import type { Stream, PrayerRequest } from './types/stream';
import { StreamService } from './lib/streamService';
import { Navbar } from './components/Navbar';
import { HeroLiveStream } from './components/HeroLiveStream';
import { UpcomingSection } from './components/UpcomingSection';
import { PreviousArchive } from './components/PreviousArchive';
import { PrayerWallModal, INITIAL_PRAYERS } from './components/PrayerWallModal';
import { GivingModal } from './components/GivingModal';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';

export function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'live' | 'upcoming' | 'previous'>('home');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGivingOpen, setIsGivingOpen] = useState(false);
  const [isPrayerOpen, setIsPrayerOpen] = useState(false);

  // Synchronized community prayer requests
  const [prayers, setPrayers] = useState<PrayerRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bf_prayers_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_PRAYERS;
  });

  const handleAddPrayer = (name: string, request: string) => {
    const newPrayer: PrayerRequest = {
      id: 'p-' + Date.now(),
      name: name.trim() || 'Online Believer',
      request: request.trim(),
      created_at: 'Just now',
      praying_count: 1
    };

    setPrayers(prev => {
      const updated = [newPrayer, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('bf_prayers_v1', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handlePrayFor = (id: string) => {
    setPrayers(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, praying_count: p.praying_count + 1 } : p);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bf_prayers_v1', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const fetchStreams = async () => {
    try {
      const data = await StreamService.getAllStreams();
      setStreams(data);

      // Prioritize active live stream, or keep current active, or fallback to first
      const live = data.find(s => s.status === 'live');
      if (live) {
        setActiveStream(live);
      } else if (!activeStream || !data.some(s => s.id === activeStream.id)) {
        setActiveStream(data[0] || null);
      }
    } catch (err) {
      console.error('Failed to load streams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
    const unsubscribe = StreamService.subscribeToStreams(() => {
      fetchStreams();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSelectStream = (stream: Stream) => {
    setActiveStream(stream);
    const playerEl = document.getElementById('main-player');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const liveStream = streams.find(s => s.status === 'live') || null;
  const upcomingStreams = streams.filter(s => s.status === 'upcoming');
  const previousStreams = streams.filter(s => s.status === 'ended');

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Welcome / Motto Banner */}
      <div className="announcement-banner">
        <div className="announcement-content">
          <span style={{ color: 'var(--gold-400)', marginRight: '8px' }}>✦ BE_FORTIFIED:</span>
          <span>BEFORTIFIED IN YOUR MIND</span>
          <span style={{ color: 'var(--gold-400)', margin: '0 8px' }}>•</span>
          <span>BEFORTIFIED IN YOUR RESOLVE</span>
          <span style={{ color: 'var(--gold-400)', margin: '0 8px' }}>•</span>
          <span>BEFORTIFIED IN YOUR POSITION</span>
          <span style={{ color: 'var(--gold-400)', marginLeft: '8px' }}>✦</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        liveStream={liveStream}
        onOpenGiving={() => setIsGivingOpen(true)}
        onOpenPrayer={() => setIsPrayerOpen(true)}
      />

      {/* Main Page Body */}
      <main className="main-content" style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--blue-900)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
              Loading Be Fortified Streaming Network...
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Connecting to church video broadcasts</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: HOME */}
            {currentTab === 'home' && (
              <>
                {/* Hero Spotlight Player */}
                <HeroLiveStream
                  stream={activeStream}
                  onOpenPrayer={() => setIsPrayerOpen(true)}
                  onOpenGiving={() => setIsGivingOpen(true)}
                  prayers={prayers}
                  onAddPrayer={handleAddPrayer}
                />

                {/* Upcoming Videos Section */}
                <UpcomingSection
                  upcomingStreams={upcomingStreams}
                  onSelectStream={handleSelectStream}
                />

                {/* Previous Videos Section */}
                <PreviousArchive
                  previousStreams={previousStreams}
                  onSelectStream={handleSelectStream}
                />
              </>
            )}

            {/* VIEW 2: LIVE DEDICATED */}
            {currentTab === 'live' && (
              <div style={{ paddingTop: '16px' }}>
                <div className="container" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="section-title-wrap">
                      <span className="section-pretitle">Online Network Broadcast</span>
                      <h2 className="section-title">🔴 Watch Live Service</h2>
                    </div>
                    {liveStream && (
                      <span className="live-badge" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                        <span className="live-dot" /> STREAMING LIVE NOW
                      </span>
                    )}
                  </div>
                </div>

                <HeroLiveStream
                  stream={liveStream || activeStream}
                  onOpenPrayer={() => setIsPrayerOpen(true)}
                  onOpenGiving={() => setIsGivingOpen(true)}
                  prayers={prayers}
                  onAddPrayer={handleAddPrayer}
                />

                {upcomingStreams.length > 0 && (
                  <UpcomingSection
                    upcomingStreams={upcomingStreams}
                    onSelectStream={handleSelectStream}
                  />
                )}
              </div>
            )}

            {/* VIEW 3: UPCOMING DEDICATED */}
            {currentTab === 'upcoming' && (
              <div style={{ paddingTop: '32px' }}>
                <UpcomingSection
                  upcomingStreams={upcomingStreams}
                  onSelectStream={(s) => {
                    handleSelectStream(s);
                    setCurrentTab('home');
                  }}
                />
              </div>
            )}

            {/* VIEW 4: PREVIOUS DEDICATED */}
            {currentTab === 'previous' && (
              <div style={{ paddingTop: '32px' }}>
                <PreviousArchive
                  previousStreams={previousStreams}
                  onSelectStream={(s) => {
                    handleSelectStream(s);
                    setCurrentTab('home');
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <PrayerWallModal
        isOpen={isPrayerOpen}
        onClose={() => setIsPrayerOpen(false)}
        prayers={prayers}
        onAddPrayer={handleAddPrayer}
        onPrayFor={handlePrayFor}
      />

      <GivingModal
        isOpen={isGivingOpen}
        onClose={() => setIsGivingOpen(false)}
      />

      {/* Footer */}
      <Footer
        onNav={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPrayer={() => setIsPrayerOpen(true)}
        onOpenGiving={() => setIsGivingOpen(true)}
      />

      {/* Mobile Bottom Dock (App-Like Streaming Experience) */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        liveStream={liveStream}
        onOpenGiving={() => setIsGivingOpen(true)}
        onOpenPrayer={() => setIsPrayerOpen(true)}
      />
    </div>
  );
}

export default App;
