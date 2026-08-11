import React, { useState } from 'react';
import { X, Upload, FileAudio, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { refreshSongs } = useApp();

  const [title, setTitle] = useState('');
  const [firstSinger, setFirstSinger] = useState('');
  const [secondSinger, setSecondSinger] = useState('');
  const [otherSinger, setOtherSinger] = useState('');
  const [composer, setComposer] = useState('');
  const [musicLabel, setMusicLabel] = useState('');
  const [movieName, setMovieName] = useState('');
  const [actor, setActor] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [language, setLanguage] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [songFile, setSongFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSongFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!songFile) {
      setError('Please select an audio file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!firstSinger.trim()) {
      setError('Please enter the primary singer.');
      return;
    }

    setError(null);
    setLoading(false);

    const formData = new FormData();
    formData.append('song', songFile);
    formData.append('title', title.trim());
    formData.append('firstSinger', firstSinger.trim());

    if (secondSinger.trim()) {
      formData.append('secondSinger', secondSinger.trim());
    }
    if (musicLabel.trim()) {
      formData.append('musicLabel', musicLabel.trim());
    }
    if (movieName.trim()) {
      formData.append('movieName', movieName.trim());
    }
    if (sourceUrl.trim()) {
      formData.append('sourceUrl', sourceUrl.trim());
    }
    if (language.trim()) {
      formData.append('language', language.trim());
    }
    if (originCountry.trim()) {
      formData.append('originCountry', originCountry.trim());
    }

    // Split array fields by comma, trim them, and append individually
    if (otherSinger.trim()) {
      otherSinger.split(',').forEach(s => {
        const val = s.trim();
        if (val) formData.append('otherSinger', val);
      });
    }
    if (composer.trim()) {
      composer.split(',').forEach(c => {
        const val = c.trim();
        if (val) formData.append('composer', val);
      });
    }
    if (actor.trim()) {
      actor.split(',').forEach(a => {
        const val = a.trim();
        if (val) formData.append('actor', val);
      });
    }

    setLoading(true);
    try {
      await api.uploadSong(formData);
      await refreshSongs();
      alert('Song uploaded successfully!');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload song.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '24px 32px',
          border: '1px solid var(--border-color)',
          width: '640px',
          maxWidth: '90%',
          boxShadow: '0 8px 32px var(--shadow-color)',
          color: 'var(--text-main)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Upload New Song</h2>
          <button onClick={onClose} className="icon-btn" style={{ width: '32px', height: '32px' }} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(233, 20, 41, 0.15)',
            border: '1px solid var(--accent-red)',
            color: 'var(--accent-red)',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* File Upload Area */}
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: songFile ? 'rgba(29, 185, 84, 0.04)' : 'var(--bg-input)',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}>
            <input 
              type="file" 
              accept="audio/*" 
              onChange={handleFileChange} 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            />
            {songFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <FileAudio size={36} style={{ color: 'var(--accent-green)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{songFile.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {(songFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Upload size={36} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Choose an audio file or drag it here</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supported formats: MP3, WAV, FLAC, AAC, etc.</span>
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Song Title *</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Naina"
                disabled={loading}
              />
            </div>

            {/* Primary Singer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Primary Singer *</label>
              <input 
                type="text" 
                value={firstSinger} 
                onChange={(e) => setFirstSinger(e.target.value)} 
                required 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Arijit Sing"
                disabled={loading}
              />
            </div>

            {/* Supporting Singer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Supporting (Second) Singer</label>
              <input 
                type="text" 
                value={secondSinger} 
                onChange={(e) => setSecondSinger(e.target.value)} 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Amitabh Bhattacharya"
                disabled={loading}
              />
            </div>

            {/* Other Singers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Other Singers (comma separated)</label>
              <input 
                type="text" 
                value={otherSinger} 
                onChange={(e) => setOtherSinger(e.target.value)} 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Singer A, Singer B"
                disabled={loading}
              />
            </div>

            {/* Composer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Composer(s) (comma separated)</label>
              <input 
                type="text" 
                value={composer} 
                onChange={(e) => setComposer(e.target.value)} 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Pritam, AR Rahman"
                disabled={loading}
              />
            </div>

            {/* Movie Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Movie / Album Name</label>
              <input 
                type="text" 
                value={movieName} 
                onChange={(e) => setMovieName(e.target.value)} 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Dangal"
                disabled={loading}
              />
            </div>

            {/* Actors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Cast / Actors (comma separated)</label>
              <input 
                type="text" 
                value={actor} 
                onChange={(e) => setActor(e.target.value)} 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Aamir Khan, Sakshi Tanwar"
                disabled={loading}
              />
            </div>

            {/* Music Label */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Music Label</label>
              <input 
                type="text" 
                value={musicLabel} 
                onChange={(e) => setMusicLabel(e.target.value)} 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Zee Music Company"
                disabled={loading}
              />
            </div>

            {/* Source URL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Source / YouTube Link</label>
              <input 
                type="text" 
                value={sourceUrl} 
                onChange={(e) => setSourceUrl(e.target.value)} 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. https://www.youtube.com/watch?v=..."
                disabled={loading}
              />
            </div>

            {/* Language */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Language</label>
              <input 
                type="text" 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)} 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Hindi"
                disabled={loading}
              />
            </div>

            {/* Origin Country */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label className="spotify-label" style={{ marginBottom: 0 }}>Origin Country</label>
              <input 
                type="text" 
                value={originCountry} 
                onChange={(e) => setOriginCountry(e.target.value)} 
                className="spotify-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. India"
                disabled={loading}
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px', borderRadius: '20px', fontSize: '0.85rem', textTransform: 'none' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2, padding: '10px', borderRadius: '20px', fontSize: '0.85rem', textTransform: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Song'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
