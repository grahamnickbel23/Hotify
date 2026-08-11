import React from 'react';
import { X, ListMusic, Music } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CreateSelectionModal: React.FC = () => {
  const { isCreateMenuOpen, setIsCreateMenuOpen, setActiveSection, setSelectedPlaylistId } = useApp();

  if (!isCreateMenuOpen) return null;

  const handleSelect = (option: 'playlist' | 'song') => {
    setSelectedPlaylistId(null);
    if (option === 'playlist') {
      setActiveSection('playlist-create');
    } else {
      setActiveSection('song-upload');
    }
    setIsCreateMenuOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsCreateMenuOpen(false)}>
      <div 
        className="modal-content create-selection-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid var(--border-color)',
          width: '90%',
          maxWidth: '480px',
          boxShadow: '0 8px 32px var(--shadow-color)',
          color: 'var(--text-main)',
          position: 'relative'
        }}
      >
        <button 
          onClick={() => setIsCreateMenuOpen(false)} 
          className="icon-btn" 
          style={{ position: 'absolute', top: '20px', right: '20px', width: '32px', height: '32px' }}
        >
          <X size={18} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', marginBottom: '24px', letterSpacing: '-0.5px' }}>
          What do you want to create?
        </h2>

        <div className="create-selection-grid" style={{ display: 'grid', gap: '20px' }}>
          
          {/* Playlist Option */}
          <div 
            onClick={() => handleSelect('playlist')}
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-input)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-green)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.backgroundColor = 'rgba(29, 185, 84, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = 'var(--bg-input)';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(29, 185, 84, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)'
            }}>
              <ListMusic size={28} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Playlist</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Create a playlist to group your favorite songs
            </div>
          </div>

          {/* Upload Song Option */}
          <div 
            onClick={() => handleSelect('song')}
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-input)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-green)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.backgroundColor = 'rgba(29, 185, 84, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = 'var(--bg-input)';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(29, 185, 84, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)'
            }}>
              <Music size={28} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Upload Song</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Upload your own audio track and details
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
