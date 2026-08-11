import React from 'react';
import { useApp } from '../context/AppContext';

export const Logo: React.FC<{ size?: number; className?: string; showText?: boolean }> = ({ size = 48, className, showText = false }) => {
  let theme: 'dark' | 'bright' = 'dark';
  try {
    const context = useApp();
    if (context && context.theme) {
      theme = context.theme;
    }
  } catch (e) {
    // context not available or not mounted within provider
  }

  // Use the corresponding logo based on the theme
  const logoSrc = theme === 'dark' ? '/logo-dark-bg.png' : '/logo-bright-bg.png';

  return (
    <div className={`logo-container ${className || ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <img
        src={logoSrc}
        alt="Hotify"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          borderRadius: '8px',
          transition: 'transform 0.3s ease',
        }}
      />
      {showText && (
        <span style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          letterSpacing: '5px',
          color: 'var(--text-main)',
          textTransform: 'uppercase',
          marginTop: '4px'
        }}>
          Hotify
        </span>
      )}
    </div>
  );
};
