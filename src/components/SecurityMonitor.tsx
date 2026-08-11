import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

export const SecurityMonitor: React.FC = () => {
  const { userProfile } = useApp();

  const mockLogs = {
    device: 'Web Browser (Chrome/Windows)',
    ipAddress: '100.123.126.113',
    location: 'Kolkata, India',
    time: new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' IST'
  };

  const displayName = userProfile?.firstName || 'Graham';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      backgroundColor: 'var(--bg-main)',
      minHeight: '100%',
      width: '100%',
      fontFamily: 'var(--font-family)',
      overflowY: 'auto'
    }}>
      {/* Top Header Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <Logo size={42} />
        <span style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '8px',
          color: 'var(--text-main)',
          textTransform: 'uppercase',
          marginTop: '8px',
          paddingLeft: '8px' // offset last letter spacing
        }}>
          Hotify
        </span>
      </div>

      {/* Main Email-Style Card Container */}
      <div style={{
        backgroundColor: '#111111',
        border: '1px solid #222222',
        borderRadius: '8px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '520px',
        color: '#ffffff',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
        textAlign: 'center'
      }}>
        {/* Security Monitor Label */}
        <div style={{
          color: '#1db954',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          Security Monitor
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 400,
          color: '#ffffff',
          marginBottom: '24px',
          fontFamily: "'Outfit', Georgia, serif"
        }}>
          Successful Sign-In
        </h2>

        {/* Message */}
        <p style={{
          fontSize: '0.92rem',
          lineHeight: '1.6',
          color: '#b3b3b3',
          textAlign: 'left',
          marginBottom: '28px'
        }}>
          Hello {displayName}, we detected a successful sign-in to your <span style={{ letterSpacing: '2px', fontWeight: 600 }}>H O T I F Y</span> account. Here are the access framework logs for this session:
        </p>

        {/* Log Box Table */}
        <div style={{
          backgroundColor: '#181818',
          border: '1px solid #282828',
          borderRadius: '6px',
          padding: '24px',
          textAlign: 'left',
          marginBottom: '28px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #222222' }}>
                <td style={{ padding: '10px 0', color: '#7f7f7f', fontWeight: 600, width: '120px', textTransform: 'uppercase' }}>Device:</td>
                <td style={{ padding: '10px 0', color: '#ffffff', fontWeight: 500 }}>{mockLogs.device}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #222222' }}>
                <td style={{ padding: '10px 0', color: '#7f7f7f', fontWeight: 600, textTransform: 'uppercase' }}>IP Address:</td>
                <td style={{ padding: '10px 0', color: '#1db954', fontWeight: 600 }}>{mockLogs.ipAddress}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #222222' }}>
                <td style={{ padding: '10px 0', color: '#7f7f7f', fontWeight: 600, textTransform: 'uppercase' }}>Location:</td>
                <td style={{ padding: '10px 0', color: '#ffffff', fontWeight: 500 }}>{mockLogs.location}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0', color: '#7f7f7f', fontWeight: 600, textTransform: 'uppercase' }}>Time:</td>
                <td style={{ padding: '10px 0', color: '#b3b3b3', fontWeight: 500 }}>{mockLogs.time}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recognizing warning */}
        <div style={{
          fontSize: '0.8rem',
          lineHeight: '1.5',
          color: '#7f7f7f',
          textAlign: 'left',
          borderTop: '1px solid #222222',
          paddingTop: '20px'
        }}>
          <span style={{ fontWeight: 600, color: '#b3b3b3' }}>Recognize this activity?</span> If this was you, no further action is necessary. However, if you don't recognize this device or location metadata, please change your security keys immediately to protect your streaming playlists.
        </div>
      </div>

      {/* Powered by footer */}
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginTop: '32px',
        textAlign: 'center'
      }}>
        Powered by Hotify Notification Systems • Kolkata, India
      </div>
    </div>
  );
};
