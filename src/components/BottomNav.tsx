import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Search, History } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeSection, setActiveSection, setSelectedPlaylistId } = useApp();

  return (
    <nav className="bottom-nav">
      <button
        className="bottom-nav-btn"
        onClick={() => { setActiveSection('home'); setSelectedPlaylistId(null); }}
        style={{ color: activeSection === 'home' ? 'var(--text-main)' : 'var(--text-secondary)' }}
      >
        <Home size={24} />
        <span>Home</span>
      </button>
      <button
        className="bottom-nav-btn"
        onClick={() => { setActiveSection('search'); setSelectedPlaylistId(null); }}
        style={{ color: activeSection === 'search' ? 'var(--text-main)' : 'var(--text-secondary)' }}
      >
        <Search size={24} />
        <span>Search</span>
      </button>
      <button
        className="bottom-nav-btn"
        onClick={() => { setActiveSection('history'); setSelectedPlaylistId(null); }}
        style={{ color: activeSection === 'history' ? 'var(--text-main)' : 'var(--text-secondary)' }}
      >
        <History size={24} />
        <span>History</span>
      </button>
    </nav>
  );
};
