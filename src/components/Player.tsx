import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  VolumeX,
  Volume2,
  Music,
  Sliders,
  Settings
} from 'lucide-react';

export const Player: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    volume,
    playbackProgress,
    playbackDuration,
    isShuffle,
    isRepeat,
    playbackQuality,
    setVolume,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    setShuffle,
    setRepeat,
    setPlaybackQuality,
    isLyricsOpen,
    setIsLyricsOpen,
    userProfile,
    toggleAudioMode
  } = useApp();

  const [prevVolume, setPrevVolume] = useState(volume);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getSingerDisplay = () => {
    if (!currentSong) return '';
    const primary = currentSong.firstSinger || currentSong.singer || currentSong.artist;
    const second = currentSong.secondSinger;
    if (primary && second) {
      return `${primary}, ${second}`;
    }
    return primary || 'Unknown Singer';
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume > 0 ? prevVolume : 0.8);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  const qualityMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showQualityMenu) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const button = document.getElementById('quality-menu-btn');
      if (button && button.contains(e.target as Node)) {
        return;
      }
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showQualityMenu]);

  const progressPercent = playbackDuration > 0 ? (playbackProgress / playbackDuration) * 100 : 0;
  
  const isServerAudio = userProfile?.audioOut === 'server';
  const maxVolume = isServerAudio ? 200 : 1;
  const volumeStep = isServerAudio ? 1 : 0.01;
  const volumePercent = isServerAudio ? (volume / 200) * 100 : (volume * 100);

  return (
    <div className="player-bar">
      {/* Left side: Track details */}
      <div className="player-left-section" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {currentSong ? (
          <>
            <div
              className="hide-on-mobile"
              onClick={() => setIsLyricsOpen(!isLyricsOpen)}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '6px',
                backgroundColor: 'var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'transform 0.2s ease, background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.backgroundColor = 'var(--border-color)';
              }}
              title="View Lyrics"
            >
              <Music size={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                onClick={() => setIsLyricsOpen(!isLyricsOpen)}
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                  e.currentTarget.style.color = 'var(--accent-green)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
                title="View Lyrics"
              >
                {currentSong.title}
              </span>
              <span style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '2px'
              }}>
                {getSingerDisplay()}
              </span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            No song selected
          </div>
        )}
      </div>

      {/* Center: Playback & progress controls */}
      <div className="player-center-section" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        maxWidth: '600px'
      }}>
        {/* Buttons */}
        <div className="player-controls-container" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => setShuffle(!isShuffle)}
            className={`player-control-btn hide-on-mobile ${isShuffle ? 'active' : ''}`}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button onClick={prevTrack} className="player-control-btn" title="Previous">
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            className="player-play-btn"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
            )}
          </button>

          <button onClick={nextTrack} className="player-control-btn" title="Next">
            <SkipForward size={20} />
          </button>

          <button
            onClick={() => setRepeat(!isRepeat)}
            className={`player-control-btn hide-on-mobile ${isRepeat ? 'active' : ''}`}
            title="Repeat"
          >
            <Repeat size={16} />
          </button>
        </div>

        {/* Desktop Playback Progress Slider */}
        <div className="player-progress-container-desktop hide-on-mobile" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '35px', textAlign: 'right' }}>
            {formatTime(playbackProgress)}
          </span>
          <input
            type="range"
            min="0"
            max={playbackDuration || 100}
            value={playbackProgress}
            onChange={handleSeekChange}
            className="playback-progressbar"
            style={{
              flex: 1,
              '--progress-percent': `${progressPercent}%`
            } as React.CSSProperties}
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '35px' }}>
            {formatTime(playbackDuration)}
          </span>
        </div>
      </div>

      {/* Mobile Playback Progress Slider */}
      <div className="player-progress-container show-on-mobile" style={{ display: 'none' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '35px', textAlign: 'right' }}>
          {formatTime(playbackProgress)}
        </span>
        
        <input
          type="range"
          min="0"
          max={playbackDuration || 100}
          value={playbackProgress}
          onChange={handleSeekChange}
          className="playback-progressbar"
          style={{
            flex: 1,
            '--progress-percent': `${progressPercent}%`
          } as React.CSSProperties}
        />

        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '35px' }}>
          {formatTime(playbackDuration)}
        </span>
      </div>

      {/* Right side: Volume, Quality & Settings */}
      <div className="player-right-section" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: '30%',
        minWidth: '180px',
        gap: '20px'
      }}>
        <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Quality select symbol & dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              id="quality-menu-btn"
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="player-control-btn"
              style={{ padding: '6px' }}
              title={`Streaming Quality: ${playbackQuality === '128' ? 'High' : playbackQuality === '64' ? 'Medium' : 'Low'} (${playbackQuality} kbps)`}
            >
              <Sliders size={18} />
            </button>

            {showQualityMenu && (
              <div 
                ref={qualityMenuRef}
                style={{
                  position: 'absolute',
                  bottom: '40px',
                  right: '0',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '6px',
                  boxShadow: '0 -4px 16px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 150,
                  minWidth: '160px'
                }}
              >
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  padding: '4px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '4px'
                }}>
                  Audio Quality
                </span>
                {[
                  { val: '128', label: '128 kbps (High)' },
                  { val: '64', label: '64 kbps (Medium)' },
                  { val: '32', label: '32 kbps (Low)' }
                ].map((q) => {
                  const isSelected = playbackQuality === q.val;
                  return (
                    <button
                      key={q.val}
                      onClick={() => {
                        setPlaybackQuality(q.val as '32' | '64' | '128');
                        setShowQualityMenu(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        borderRadius: '4px',
                        display: 'block',
                        width: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: isSelected ? 'var(--accent-green)' : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s, color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>{q.label}</span>
                        {isSelected && <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Volume controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isServerAudio ? '160px' : '120px' }}>
            <button onClick={toggleMute} className="player-control-btn" style={{ opacity: 0.8 }}>
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            
            <input
              type="range"
              min="0"
              max={maxVolume}
              step={volumeStep}
              value={volume}
              onChange={handleVolumeChange}
              className="playback-progressbar"
              style={{
                width: '100%',
                '--progress-percent': `${volumePercent}%`
              } as React.CSSProperties}
            />
            {isServerAudio && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{Math.round(volume)}</span>}
          </div>

          {/* Audio Output Toggle Switch */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); toggleAudioMode(); }}
            title={isServerAudio ? "Audio Output: Server" : "Audio Output: Device"}
          >
            <Music size={16} style={{ color: isServerAudio ? 'var(--accent-green)' : 'var(--text-secondary)' }} />
            <div style={{
              width: '36px',
              height: '20px',
              backgroundColor: isServerAudio ? 'var(--accent-green)' : 'var(--border-color)',
              borderRadius: '20px',
              position: 'relative',
              transition: 'background-color 0.3s ease'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: isServerAudio ? '18px' : '2px',
                transition: 'left 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </div>
          </div>
        </div>

        {/* Mobile Settings Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="player-control-btn show-on-mobile"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Mobile Player Popup Menu */}
      {showMobileMenu && (
        <>
          <div 
            onClick={() => setShowMobileMenu(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 199 }}
          />
          <div style={{
            position: 'absolute',
            bottom: '80px',
            right: '16px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 200,
            width: '240px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Controls</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setShuffle(!isShuffle)}
                className={`player-control-btn ${isShuffle ? 'active' : ''}`}
                style={{ flex: 1, padding: '8px', backgroundColor: 'var(--bg-card-hover)', borderRadius: '6px' }}
              >
                <Shuffle size={18} style={{ margin: '0 auto' }} />
              </button>
              <div style={{ width: '8px' }} />
              <button
                onClick={() => setRepeat(!isRepeat)}
                className={`player-control-btn ${isRepeat ? 'active' : ''}`}
                style={{ flex: 1, padding: '8px', backgroundColor: 'var(--bg-card-hover)', borderRadius: '6px' }}
              >
                <Repeat size={18} style={{ margin: '0 auto' }} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="range"
                min="0"
                max={maxVolume}
                step={volumeStep}
                value={volume}
                onChange={handleVolumeChange}
                className="playback-progressbar"
                style={{ flex: 1, '--progress-percent': `${volumePercent}%` } as React.CSSProperties}
              />
              {isServerAudio && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{Math.round(volume)}</span>}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality</span>
              {(['128', '64', '32'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setPlaybackQuality(q)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    textAlign: 'left',
                    backgroundColor: playbackQuality === q ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                    color: playbackQuality === q ? 'var(--accent-green)' : 'var(--text-secondary)',
                    fontWeight: playbackQuality === q ? 700 : 500,
                  }}
                >
                  {q} kbps
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
