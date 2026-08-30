import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { Player } from './components/Player';
import { LyricsSidebar } from './components/LyricsSidebar';
import { LoginModal } from './components/LoginModal';
import { Logo } from './components/Logo';
import { CreateSelectionModal } from './components/CreateSelectionModal';
import { BottomNav } from './components/BottomNav';
import './App.css';

const AppContent: React.FC = () => {
  const { isLoggedIn, authStep, isCheckingAuth } = useApp();

  // Prevent accidental/automatic reloads (especially on mobile backgrounding)
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Required by modern browsers to trigger the confirmation dialog
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Show a pulsing loader while verifying the session on page reload/mount
  if (isCheckingAuth) {
    return (
      <div className="loading-screen">
        <div className="loading-logo-container">
          <Logo size={96} showText={true} className="loading-logo-pulse" />
        </div>
      </div>
    );
  }

  // If the user is not authenticated or in login/otp/register phase, render the auth screen
  if (!isLoggedIn || authStep !== 'dashboard') {
    return <LoginModal />;
  }

  // Once logged in, show the full multi-column layout
  return (
    <div className="app-container">
      <Header />
      <Sidebar />
      <MainContent />
      <Player />
      <LyricsSidebar />
      <CreateSelectionModal />
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

