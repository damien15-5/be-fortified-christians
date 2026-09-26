import React, { useState } from 'react';
import { X, Heart, Copy, Check, Landmark, ShieldCheck } from 'lucide-react';

interface GivingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GivingModal: React.FC<GivingModalProps> = ({ isOpen, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--gold-600) 0%, var(--gold-700) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={20} fill="white" />
            <h3 className="modal-title">Worship Through Giving</h3>
          </div>
          <button onClick={onClose} style={{ color: 'white' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Scripture Encouragement */}
          <div className="scripture-box" style={{ marginBottom: '20px' }}>
            <div className="scripture-label">2 Corinthians 9:7</div>
            <div className="scripture-quote">
              "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
            </div>
          </div>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Your generous partnership supports kingdom advancement, media broadcasting, community welfare, and local evangelism across nations.
          </p>

          {/* Giving Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Official Church Giving Account */}
            <div style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--border-blue)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Landmark size={20} color="var(--blue-800)" />
                  <span style={{ fontWeight: 800, color: 'var(--blue-950)', fontSize: '1rem' }}>
                    Official Church Giving Account
                  </span>
                </div>
                <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '0.74rem', fontWeight: 800, padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                  VERIFIED
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bank Name</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue-950)', marginBottom: '6px' }}>Moniepoint MFB</div>
                  
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Account Number</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--blue-900)', letterSpacing: '0.06em', fontFamily: 'var(--font-heading)' }}>
                    3003396337
                  </div>

                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Account Name: <strong style={{ color: 'var(--blue-950)' }}>Befortified Projects Services</strong>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => copyText('3003396337', 'acc_moniepoint')}
                  style={{ gap: '6px', alignSelf: 'center', padding: '10px 18px' }}
                >
                  {copiedField === 'acc_moniepoint' ? <Check size={16} color="#4ADE80" /> : <Copy size={16} />}
                  <span>{copiedField === 'acc_moniepoint' ? 'Copied!' : 'Copy Number'}</span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', background: '#DCFCE7', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.84rem' }}>
            <ShieldCheck size={18} />
            <span>All contributions are securely processed and receipted. God bless your seed!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
