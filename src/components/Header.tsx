import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { Search as SearchIcon, Compass, Music, Play, Check, Plus, Menu } from 'lucide-react';
import { api } from '../api';

export const Header: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    setActiveSection,
    setSelectedPlaylistId,
    searchResults,
    playSong,
    currentSong,
    setIsCreateMenuOpen,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen
  } = useApp();

  const [isFocused, setIsFocused] = useState(false);

  const getSingerDisplay = (song: any) => {
    const primary = song.firstSinger || song.singer || song.artist;
    const second = song.secondSinger;
    if (primary && second) {
      return `${primary}, ${second}`;
    }
    return primary || 'Unknown Singer';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    // Dropdown suggestions will render directly beneath the input
  };

  return (
    <header className="header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {/* Left side: Icons and Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Mobile menu (switch) icon */}
        <button
          className="show-on-mobile"
          onClick={() => setIsMobileDrawerOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="Menu"
        >
          <Menu size={24} />
        </button>

        {/* Desktop Logo & Text Container */}
        <div className="mobile-drawer-trigger hide-on-mobile" style={{
          width: '240px',
          paddingLeft: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          boxSizing: 'border-box'
        }} onClick={() => {
          setSelectedPlaylistId(null);
          setActiveSection('home');
        }}>
          <Logo size={28} />
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '1px'
          }}>
            Hotify
          </span>
        </div>
      </div>

      {/* Center: Perfectly centered Spotify-style Search Input */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className="header-search-container" style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px'
        }}>
          <div style={{
            width: '100%',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-input)',
            borderRadius: '500px',
            padding: '0 20px',
            boxSizing: 'border-box',
            boxShadow: '0 2px 8px var(--shadow-color)',
            border: '1px solid var(--border-color)'
          }}>
            <SearchIcon size={20} style={{ color: 'var(--text-secondary)', marginRight: '12px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="What do you want to play?"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                handleSearchFocus();
                setIsFocused(true);
              }}
              onBlur={() => {
                setTimeout(() => setIsFocused(false), 200);
              }}
              className="search-input"
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                width: '100%',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            {/* Vertical divider line */}
            <div style={{
              width: '1px',
              height: '22px',
              backgroundColor: 'var(--border-color)',
              margin: '0 12px',
              flexShrink: 0
            }} />
            {/* Compass / Browse icon representing explore */}
            <Compass size={20} style={{ color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }} />
          </div>

          {/* Search Suggestions Dropdown */}
          {isFocused && searchQuery.trim() !== '' && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '56px',
              left: 0,
              right: 0,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 0',
              zIndex: 100,
              boxShadow: '0 8px 24px var(--shadow-color)',
              maxHeight: '380px',
              overflowY: 'auto'
            }}>
              {searchResults.map((song) => {
                const isCurrent = currentSong?._id === song._id;
                return (
                  <div
                    key={song._id}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input onBlur from unmounting before click registers
                      playSong(song, searchResults);
                      api.recordSearchHistory(searchQuery, song._id).catch(err => {
                        console.warn('Failed to record search history:', err);
                      });
                      setIsFocused(false); // Close dropdown
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      {/* Cover art thumbnail */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-card-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: song.coverUrl ? `url(${song.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1db954 0%, #191414 100%)'
                      }}>
                        {!song.coverUrl && <Music size={16} style={{ color: '#fff' }} />}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{
                          fontWeight: 600,
                          color: isCurrent ? 'var(--accent-green)' : 'var(--text-main)',
                          fontSize: '0.88rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {song.title}
                        </span>
                        <span style={{
                          fontSize: '0.76rem',
                          color: 'var(--text-secondary)',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          Song • {getSingerDisplay(song)}
                        </span>
                      </div>
                    </div>

                    {/* Action Icon on the Right */}
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {isCurrent ? (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000000'
                        }}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                      ) : (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-main)',
                          opacity: 0.7
                        }}>
                          <Play size={10} fill="currentColor" style={{ marginLeft: '1px' }} />
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Settings replaced with "+ Create" button */}
      <div className="header-right-section" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        boxSizing: 'border-box'
      }}>
        {/* Desktop Create Button */}
        <button
          className="hide-on-mobile"
          onClick={() => setIsCreateMenuOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-main)',
            borderRadius: '500px',
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 700,
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
            e.currentTarget.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-input)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Create"
        >
          <Plus size={16} strokeWidth={2.5} />
          Create
        </button>

        {/* Mobile Create Button */}
        <button
          className="show-on-mobile"
          onClick={() => setIsCreateMenuOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="Create"
        >
          <Plus size={24} />
        </button>
      </div>
    </header>
  );
};
