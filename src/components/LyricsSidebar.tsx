import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { X, Copy, Check, Music, AlertCircle } from 'lucide-react';

export const LyricsSidebar: React.FC = () => {
  const { currentSong, isLyricsOpen, setIsLyricsOpen } = useApp();
  const [lyricsText, setLyricsText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLyricsOpen || !currentSong) {
      if (!isLyricsOpen) {
        // Clear states when closing to avoid flickering next time
        setLyricsText(null);
        setError(null);
      }
      return;
    }

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      setLyricsText(null);
      try {
        const res = await api.getSongLyrics(currentSong._id);
        if (res && res.lyricsInfo && res.lyricsInfo.lyrics) {
          setLyricsText(res.lyricsInfo.lyrics);
        } else {
          setError('No lyrics available for this song.');
        }
      } catch (err: any) {
        console.error('Error fetching lyrics:', err);
        setError(err.message || 'Failed to fetch lyrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [currentSong?._id, isLyricsOpen]);

  // Scroll to top of lyrics when song changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentSong?._id]);

  const handleCopy = () => {
    if (!lyricsText) return;
    navigator.clipboard.writeText(lyricsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`lyrics-sidebar ${isLyricsOpen ? 'open' : 'closed'}`}>
      {/* Header */}
      <div className="lyrics-header">
        <div className="lyrics-title-container">
          <span className="lyrics-header-title">
            {currentSong ? currentSong.title : 'Lyrics'}
          </span>
          {currentSong && (
            <span className="lyrics-header-subtitle">
              {currentSong.firstSinger || currentSong.singer || currentSong.artist || 'Unknown Artist'}
            </span>
          )}
        </div>
        <div className="lyrics-actions">
          {lyricsText && (
            <button
              onClick={handleCopy}
              className="icon-btn-small"
              style={{ color: 'var(--text-secondary)' }}
              title="Copy Lyrics"
            >
              {copied ? <Check size={18} style={{ color: 'var(--accent-green)' }} /> : <Copy size={18} />}
            </button>
          )}
          <button
            onClick={() => setIsLyricsOpen(false)}
            className="icon-btn-small"
            style={{ color: 'var(--text-secondary)' }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lyrics-content" ref={scrollContainerRef}>
        {loading && (
          <div className="lyrics-empty-state">
            <div className="lyrics-loader"></div>
            <span>Loading lyrics...</span>
          </div>
        )}

        {error && (
          <div className="lyrics-empty-state">
            <AlertCircle size={36} style={{ color: 'var(--text-muted)' }} />
            <h3>Couldn't load lyrics</h3>
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        {!loading && !error && !lyricsText && (
          <div className="lyrics-empty-state">
            <Music size={36} style={{ color: 'var(--text-muted)' }} />
            <h3>No lyrics found</h3>
            <span style={{ fontSize: '0.85rem' }}>We don't have the lyrics for this song yet.</span>
          </div>
        )}

        {!loading && !error && lyricsText && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lyricsText.split('\n').map((line, idx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={idx} style={{ height: '1.2rem' }} />;
              }
              return (
                <div key={idx} className="lyrics-line">
                  {trimmed}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
