import { useState } from 'react';
import { X, Heart, Send, Check } from 'lucide-react';
import type { PrayerRequest } from '../types/stream';

interface PrayerWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayers?: PrayerRequest[];
  onAddPrayer?: (name: string, request: string) => void;
  onPrayFor?: (id: string) => void;
}

export const INITIAL_PRAYERS: PrayerRequest[] = [
  {
    id: 'p-1',
    name: 'Sister Grace O.',
    request: 'Praying for healing and divine restoration in my mother’s body following medical diagnosis. Standing on Isaiah 53:5!',
    created_at: '2 hours ago',
    praying_count: 34
  },
  {
    id: 'p-2',
    name: 'Brother David & Family',
    request: 'Trusting God for divine open doors in career and visa breakthrough this month. Thank You Jesus for answered prayers.',
    created_at: '5 hours ago',
    praying_count: 48
  },
  {
    id: 'p-3',
    name: 'Minister Samuel T.',
    request: 'Praising God for salvation in our community youth outreach! Praying for spiritual fortitude and steadfastness in Christ.',
    created_at: '1 day ago',
    praying_count: 62
  }
];

export const PrayerWallModal: React.FC<PrayerWallModalProps> = ({
  isOpen,
  onClose,
  prayers: externalPrayers,
  onAddPrayer,
  onPrayFor
}) => {
  const [localPrayers, setLocalPrayers] = useState<PrayerRequest[]>(INITIAL_PRAYERS);
  const [name, setName] = useState('');
  const [request, setRequest] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const prayerList = externalPrayers || localPrayers;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !request.trim()) return;

    if (onAddPrayer) {
      onAddPrayer(name.trim(), request.trim());
    } else {
      const newPrayer: PrayerRequest = {
        id: 'p-' + Date.now(),
        name: name.trim(),
        request: request.trim(),
        created_at: 'Just now',
        praying_count: 1
      };
      setLocalPrayers([newPrayer, ...localPrayers]);
    }

    setName('');
    setRequest('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handlePray = (id: string) => {
    if (onPrayFor) {
      onPrayFor(id);
    } else {
      setLocalPrayers(localPrayers.map(p => p.id === id ? { ...p, praying_count: p.praying_count + 1 } : p));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🙏</span>
            <h3 className="modal-title">Network Prayer Wall</h3>
          </div>
          <button onClick={onClose} style={{ color: 'white' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {/* Submission Form */}
          <form onSubmit={handleSubmit} style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--blue-900)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✍️</span> Submit Your Prayer Request
            </h4>

            {submitted && (
              <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '14px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} />
                <span>Your prayer request was submitted. The Be Fortified prayer team is standing with you!</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Your Name / Family</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sister Ruth"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Prayer Need / Praise Report</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Write your prayer request or thanksgiving..."
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              <Send size={14} />
              <span>Post to Prayer Wall</span>
            </button>
          </form>

          {/* List of Prayer Requests */}
          <h4 style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Current Church Intercessions ({prayerList.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {prayerList.map(p => (
              <div
                key={p.id}
                style={{
                  background: 'white',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--blue-900)', fontSize: '0.95rem' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {p.created_at}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {p.request}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handlePray(p.id)}
                    style={{ fontSize: '0.8rem', padding: '4px 12px', gap: '6px' }}
                  >
                    <Heart size={14} color="#DC2626" fill="#DC2626" />
                    <span>I'm Praying ({p.praying_count})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
