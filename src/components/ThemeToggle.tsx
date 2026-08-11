import React from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useApp();

  return (
    <button
      onClick={toggleTheme}
      className="icon-btn"
      aria-label={`Switch to ${theme === 'dark' ? 'Bright' : 'Dark'} mode`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {theme === 'dark' ? (
        <Sun size={20} style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <Moon size={20} style={{ color: 'var(--text-secondary)' }} />
      )}
    </button>
  );
};
