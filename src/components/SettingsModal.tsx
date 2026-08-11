import React from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '32px',
        border: '1px solid var(--border-color)',
        width: '420px',
        boxShadow: '0 8px 32px var(--shadow-color)',
        color: 'var(--text-main)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Connection Settings</h2>
          <button onClick={onClose} className="icon-btn" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(29, 185, 84, 0.08)',
            border: '1px solid var(--accent-green)',
            borderRadius: '6px',
            padding: '12px',
            color: 'var(--accent-green)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-green)',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite'
            }}></span>
            Vite Proxy Routing Active
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            All API requests are routed through the Vite dev server proxy relative to your origin (<strong>{window.location.origin}</strong>). Manual URL configuration is disabled.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Auth Endpoint Route
            </label>
            <input
              type="text"
              value="/auth"
              disabled
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Main API Endpoint Route
            </label>
            <input
              type="text"
              value="/song, /playlist, /search, /streaming"
              disabled
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              onClick={onClose}
              className="btn-primary"
              style={{ flex: 1, padding: '10px', borderRadius: '20px', fontSize: '0.85rem', textTransform: 'none', boxShadow: 'none' }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
