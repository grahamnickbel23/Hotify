import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Search, History, Library, Plus, Music, User, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Sidebar: React.FC = () => {
  const {
    playlists,
    activeSection,
    setActiveSection,
    selectedPlaylistId,
    setSelectedPlaylistId,
    userProfile,
    logout,
    setIsCreateMenuOpen,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    theme,
    toggleTheme
  } = useApp();

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleSelectPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    setActiveSection('playlist-detail');
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      {isMobileDrawerOpen && (
        <div 
          className="drawer-overlay"
          onClick={() => setIsMobileDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 199
          }}
        />
      )}
      <div className={`sidebar ${isMobileDrawerOpen ? 'drawer-open' : ''}`}>
        {/* Mobile Profile Avatar at top */}
        <div 
          className="show-on-mobile" 
          onClick={() => { setActiveSection('profile-settings'); setIsMobileDrawerOpen(false); }}
          style={{ 
            flexDirection: 'column', 
            alignItems: 'center', 
            marginBottom: '24px', 
            cursor: 'pointer',
            paddingTop: '8px'
          }}
        >
          <div style={{
            width: '96px', 
            height: '96px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--accent-green) 0%, #282828 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#fff', 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(29, 185, 84, 0.4)'
          }}>
            {(userProfile?.firstName || 'Graham').charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Graham Nickbel'}
          </span>
        </div>

      {/* Primary Navigation links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          className="sidebar-nav-btn"
          onClick={() => { setActiveSection('home'); setSelectedPlaylistId(null); setIsMobileDrawerOpen(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            textAlign: 'left',
            color: activeSection === 'home' ? 'var(--text-main)' : 'var(--text-secondary)',
            fontWeight: activeSection === 'home' ? 700 : 500,
            backgroundColor: activeSection === 'home' ? 'var(--bg-card-hover)' : 'transparent',
            fontSize: '0.95rem'
          }}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button
          className="sidebar-nav-btn"
          onClick={() => { setActiveSection('search'); setSelectedPlaylistId(null); setIsMobileDrawerOpen(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            textAlign: 'left',
            color: activeSection === 'search' ? 'var(--text-main)' : 'var(--text-secondary)',
            fontWeight: activeSection === 'search' ? 700 : 500,
            backgroundColor: activeSection === 'search' ? 'var(--bg-card-hover)' : 'transparent',
            fontSize: '0.95rem'
          }}
        >
          <Search size={20} />
          <span>Search</span>
        </button>
        <button
          className="sidebar-nav-btn"
          onClick={() => { setActiveSection('history'); setSelectedPlaylistId(null); setIsMobileDrawerOpen(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            textAlign: 'left',
            color: activeSection === 'history' ? 'var(--text-main)' : 'var(--text-secondary)',
            fontWeight: activeSection === 'history' ? 700 : 500,
            backgroundColor: activeSection === 'history' ? 'var(--bg-card-hover)' : 'transparent',
            fontSize: '0.95rem'
          }}
        >
          <History size={20} />
          <span>History</span>
        </button>
      </nav>

      {/* Library & Playlists Header */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-secondary)',
          padding: '0 12px 12px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '0.9rem' }}>
            <Library size={18} />
            Your Library
          </div>
          <button
            onClick={() => {
              setIsCreateMenuOpen(true);
              setIsMobileDrawerOpen(false);
            }}
            className="icon-btn"
            style={{ width: '28px', height: '28px', color: 'var(--text-main)' }}
            title="Create Playlist or Upload Song"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Playlists List Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto',
          marginTop: '12px',
          flex: 1,
          paddingRight: '4px'
        }}>
          {playlists.length === 0 ? (
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              padding: '12px',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              No playlists created yet. Click + to get started!
            </div>
          ) : (
            playlists.map((playlist) => {
              const isSelected = selectedPlaylistId === playlist._id;
              return (
                <button
                  key={playlist._id}
                  onClick={() => handleSelectPlaylist(playlist._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    color: isSelected ? 'var(--accent-green)' : 'var(--text-secondary)',
                    backgroundColor: isSelected ? 'rgba(29, 185, 84, 0.08)' : 'transparent',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={playlist.name}
                >
                  <Music size={16} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {playlist.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Sidebar Footer with Theme, Profile and Logout actions */}
      <div className="sidebar-footer" style={{
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        {/* Profile Button */}
        <button
          className="hide-on-mobile"
          onClick={() => { setActiveSection('profile-settings'); setIsMobileDrawerOpen(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeSection === 'profile-settings' ? 'var(--accent-green)' : 'var(--text-secondary)',
            fontWeight: activeSection === 'profile-settings' ? 700 : 500,
            fontSize: '0.88rem',
            padding: '6px 8px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          title="Profile & Security Settings"
        >
          <User size={18} />
          <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userProfile?.firstName || 'Graham'}
          </span>
        </button>

        <div className="mobile-full-width" style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
          {/* Theme Switcher Full Button */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Logout Full Button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(233, 30, 99, 0.1)',
              border: '1px solid rgba(233, 30, 99, 0.3)',
              color: 'var(--accent-red)',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Custom Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              padding: '24px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '320px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-main)' }}>Confirm Logout</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                Are you sure you want to log out?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                    setIsMobileDrawerOpen(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--accent-red)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
