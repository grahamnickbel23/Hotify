import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { UserProfile, Song, Playlist } from '../api';
import { api } from '../api';
import * as dashjs from 'dashjs';

interface AppContextType {
  // Theme
  theme: 'dark' | 'bright';
  toggleTheme: () => void;

  // Settings
  authUrl: string;
  mainUrl: string;
  updateUrls: (authUrl: string, mainUrl: string) => void;

  // Auth
  isLoggedIn: boolean;
  isCheckingAuth: boolean;
  userProfile: UserProfile | null;
  loginEmail: string;
  authStep: 'login' | 'otp' | 'register' | 'register-details' | 'pending-approval' | 'dashboard';
  setAuthStep: (step: 'login' | 'otp' | 'register' | 'register-details' | 'pending-approval' | 'dashboard') => void;
  setLoginEmail: (email: string) => void;
  checkAuthOnMount: () => Promise<void>;
  handleLoginSuccess: (user: UserProfile) => void;
  logout: (password?: string) => Promise<void>;

  // Library & Data
  songs: Song[];
  playlists: Playlist[];
  refreshSongs: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;

  // Search State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Song[];
  searchLoading: boolean;

  // Navigation
  activeSection: 'home' | 'history' | 'search' | 'library' | 'playlist-detail' | 'profile-settings' | 'song-detail' | 'playlist-create' | 'song-upload';
  setActiveSection: (section: 'home' | 'history' | 'search' | 'library' | 'playlist-detail' | 'profile-settings' | 'song-detail' | 'playlist-create' | 'song-upload') => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  selectedSongId: string | null;
  setSelectedSongId: (id: string | null) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isCreateMenuOpen: boolean;
  setIsCreateMenuOpen: (open: boolean) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;

  // Playback Control
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  playbackProgress: number;
  playbackDuration: number;
  isShuffle: boolean;
  isRepeat: boolean;
  playbackQuality: '32' | '64' | '128';
  setVolume: (vol: number) => void;
  playSong: (song: Song, contextSongs?: Song[], playlistContextId?: string | null) => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: boolean) => void;
  setPlaybackQuality: (quality: '32' | '64' | '128') => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme
  const [theme, setTheme] = useState<'dark' | 'bright'>('dark');

  // Settings
  const [authUrl, setAuthUrl] = useState(api.getAuthUrl());
  const [mainUrl, setMainUrl] = useState(api.getMainUrl());

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [authStep, setAuthStep] = useState<'login' | 'otp' | 'register' | 'register-details' | 'pending-approval' | 'dashboard'>('login');

  // Content Data
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Navigation
  const [activeSection, setActiveSection] = useState<'home' | 'history' | 'search' | 'library' | 'playlist-detail' | 'profile-settings' | 'song-detail' | 'playlist-create' | 'song-upload'>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/playlists/create')) return 'playlist-create';
    if (path.startsWith('/playlists/')) return 'playlist-detail';
    if (path.startsWith('/songs/upload')) return 'song-upload';
    if (path.startsWith('/songs/')) return 'song-detail';
    if (path.startsWith('/search')) return 'search';
    if (path.startsWith('/library')) return 'library';
    if (path.startsWith('/history')) return 'history';
    if (path.startsWith('/profile')) return 'profile-settings';
    return 'home';
  });
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/playlists/') && !path.startsWith('/playlists/create')) {
      return path.substring(11);
    }
    return null;
  });
  const [selectedSongId, setSelectedSongId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/songs/') && !path.startsWith('/songs/upload')) {
      return path.substring(7);
    }
    return null;
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Playback State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isShuffle, setShuffle] = useState(false);
  const [isRepeat, setRepeat] = useState(false);
  const [playbackQuality, setPlaybackQualityState] = useState<'32' | '64' | '128'>('128');
  const playbackQualityRef = useRef(playbackQuality);
  useEffect(() => {
    playbackQualityRef.current = playbackQuality;
  }, [playbackQuality]);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  // Playback Queue
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // DASH player references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<dashjs.MediaPlayerClass | null>(null);

  // Theme Toggler
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'bright' : 'dark';
    setTheme(nextTheme);
    document.body.className = `${nextTheme}-theme`;
  };

  const updateUrls = (newAuthUrl: string, newMainUrl: string) => {
    api.setAuthUrl(newAuthUrl);
    api.setMainUrl(newMainUrl);
    setAuthUrl(newAuthUrl);
    setMainUrl(newMainUrl);
  };

  // Auth Functions
  const checkAuthOnMount = async () => {
    try {
      const data = await api.getProfile();
      handleLoginSuccess(data.user);
    } catch (err) {
      // Access token failed or missing, try refresh token
      try {
        const refreshRes = await api.refreshToken();
        if (refreshRes && refreshRes.accessToken) {
          const data = await api.getProfile();
          handleLoginSuccess(data.user);
        } else {
          handleLogoutState();
        }
      } catch {
        handleLogoutState();
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setIsLoggedIn(true);
    setUserProfile(user);
    const pref = user?.preference === 'bright' ? 'bright' : 'dark';
    setTheme(pref);
    document.body.className = `${pref}-theme`;
    setAuthStep('dashboard');
    // Load initial songs & playlists
    refreshSongs();
    refreshPlaylists();
  };

  const handleLogoutState = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setAuthStep('login');
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
  };

  const logout = async (password?: string) => {
    try {
      if (userProfile) {
        await api.logout(userProfile.email, password || '');
      } else {
        api.clearTokens();
      }
    } catch {
      api.clearTokens();
    } finally {
      handleLogoutState();
      // Reset player
      if (playerRef.current) {
        playerRef.current.reset();
      }
      setCurrentSong(null);
      setIsPlaying(false);
    }
  };

  // Data Refresh functions
  const refreshSongs = async () => {
    try {
      const res = await api.getAllSongs();
      // Handle responses containing either 'songs' or 'data' arrays
      const songsList = res.songs || (res as any).data || [];
      setSongs(songsList);
    } catch (err) {
      console.error('Error fetching songs:', err);
    }
  };

  const refreshPlaylists = async () => {
    try {
      const data = await api.getAllPlaylists();
      setPlaylists(data.playlists || []);
    } catch (err) {
      console.error('Error fetching playlists:', err);
    }
  };

  // Sync state from current URL pathname
  const syncStateFromUrl = () => {
    const path = window.location.pathname;
    
    if (path.startsWith('/songs/')) {
      const songId = path.substring(7);
      if (songId) {
        setSelectedSongId(songId);
        setActiveSection('song-detail');
        return;
      }
    } else if (path === '/playlists/create') {
      setActiveSection('playlist-create');
      setSelectedPlaylistId(null);
      setSelectedSongId(null);
      return;
    } else if (path === '/songs/upload') {
      setActiveSection('song-upload');
      setSelectedPlaylistId(null);
      setSelectedSongId(null);
      return;
    } else if (path.startsWith('/playlists/')) {
      const playlistId = path.substring(11);
      if (playlistId) {
        setSelectedPlaylistId(playlistId);
        setActiveSection('playlist-detail');
        return;
      }
    } else if (path === '/history') {
      setActiveSection('history');
      setSelectedPlaylistId(null);
      setSelectedSongId(null);
      return;
    } else if (path === '/search') {
      setActiveSection('search');
      return;
    } else if (path === '/library') {
      setActiveSection('library');
      return;
    } else if (path === '/profile') {
      setActiveSection('profile-settings');
      return;
    } else if (path === '/home' || path === '/') {
      setActiveSection('home');
      setSelectedPlaylistId(null);
      setSelectedSongId(null);
      if (path === '/') {
        window.history.replaceState({}, '', '/home');
      }
      return;
    }

    // Default fallback: navigate to home and replace URL
    setActiveSection('home');
    setSelectedPlaylistId(null);
    setSelectedSongId(null);
    window.history.replaceState({}, '', '/home');
  };

  // Popstate event listener for browser back/forward buttons
  useEffect(() => {
    if (!isLoggedIn || authStep !== 'dashboard') return;

    const handlePopState = () => {
      syncStateFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoggedIn, authStep]);

  // Push state to history when navigation state changes
  useEffect(() => {
    if (!isLoggedIn || authStep !== 'dashboard') return;

    let targetPath = '/home';
    if (activeSection === 'song-detail' && selectedSongId) {
      targetPath = `/songs/${selectedSongId}`;
    } else if (activeSection === 'playlist-create') {
      targetPath = '/playlists/create';
    } else if (activeSection === 'song-upload') {
      targetPath = '/songs/upload';
    } else if (activeSection === 'playlist-detail' && selectedPlaylistId) {
      targetPath = `/playlists/${selectedPlaylistId}`;
    } else if (activeSection === 'search') {
      targetPath = '/search';
    } else if (activeSection === 'library') {
      targetPath = '/library';
    } else if (activeSection === 'profile-settings') {
      targetPath = '/profile';
    } else if (activeSection === 'history') {
      targetPath = '/history';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ activeSection, selectedPlaylistId, selectedSongId }, '', targetPath);
    }
  }, [activeSection, selectedPlaylistId, selectedSongId, isLoggedIn, authStep]);

  // Synchronize on initial dashboard mount or login success
  useEffect(() => {
    if (isLoggedIn && authStep === 'dashboard') {
      syncStateFromUrl();
    }
  }, [isLoggedIn, authStep]);

  // Trigger search on query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.searchSongs(searchQuery);
        setSearchResults(data.result || data.songs || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);



  // Adjust audio tag volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Play a song
  const playSong = (song: Song, contextSongs: Song[] = [], playlistContextId: string | null = null) => {
    if (!audioRef.current || !playerRef.current) return;

    setCurrentSong(song);
    setIsPlaying(true);

    // Context management
    if (contextSongs.length > 0) {
      setQueue(contextSongs);
      setActivePlaylistId(playlistContextId);
      const index = contextSongs.findIndex(s => s._id === song._id);
      setCurrentQueueIndex(index !== -1 ? index : 0);
    } else {
      setQueue([song]);
      setCurrentQueueIndex(0);
      setActivePlaylistId(null);
    }

    // Call /song/read to fetch details along with playing
    api.getSongDetails(song._id).then(res => {
      if (res && res.song) {
        setCurrentSong(prev => prev?._id === song._id ? res.song : prev);
      }
    }).catch(err => {
      console.warn('Failed to fetch song details:', err);
    });

    const manifestUrl = api.getManifestUrl(song._id);
    playerRef.current.attachSource(manifestUrl);

    // Apply active quality logic
    updateQualitySettings(playbackQuality);

    audioRef.current.play().catch(err => {
      console.warn('Auto-play blocked by browser or failed stream:', err);
    });
  };

  // Handle quality settings for MPEG-DASH
  const updateQualitySettings = (quality: '32' | '64' | '128', forceSeek = false) => {
    if (!playerRef.current) return;
    
    const kbpsVal = parseInt(quality, 10);

    playerRef.current.updateSettings({
      streaming: {
        abr: {
          autoSwitchBitrate: {
            audio: false // Disable auto scaling to force selected quality
          }
        }
      }
    });

    try {
      const p = playerRef.current as any;
      const list = p.getBitrateInfoListFor('audio');
      if (list && list.length > 0) {
        // Find the representation that is closest to our target bitrate (kbpsVal)
        const best = list.reduce((prev: any, curr: any) => {
          const prevKbps = prev.bitrate > 1000 ? Math.round(prev.bitrate / 1000) : prev.bitrate;
          const currKbps = curr.bitrate > 1000 ? Math.round(curr.bitrate / 1000) : curr.bitrate;
          return Math.abs(currKbps - kbpsVal) < Math.abs(prevKbps - kbpsVal) ? curr : prev;
        });
        
        const qualityIndex = typeof best.qualityIndex === 'number' ? best.qualityIndex : list.indexOf(best);
        p.setQualityFor('audio', qualityIndex);
        console.log(`DASH: Programmatically mapped ${quality} kbps to qualityIndex ${qualityIndex} (bitrate: ${best.bitrate} kbps)`);
      } else {
        // Fallback if list is not populated yet
        const qualityIndex = quality === '128' ? 0 : quality === '64' ? 1 : 2;
        p.setQualityFor('audio', qualityIndex);
        console.log(`DASH: Fallback mapping ${quality} kbps to qualityIndex ${qualityIndex}`);
      }
    } catch (err) {
      console.warn('Failed to set quality representation index in dash.js:', err);
    }

    // Seek slightly to force segment re-fetching at new quality representation
    if (forceSeek && audioRef.current) {
      const current = audioRef.current.currentTime;
      audioRef.current.currentTime = current;
    }
  };

  const setPlaybackQuality = (quality: '32' | '64' | '128') => {
    setPlaybackQualityState(quality);
    updateQualitySettings(quality, true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentSong) {
        audioRef.current.play().catch(console.warn);
        setIsPlaying(true);
      } else if (songs.length > 0) {
        playSong(songs[0], songs);
      }
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlaybackProgress(time);
    }
  };

  // Next Track logic (incorporates Autoplay microservice endpoint)
  const nextTrack = async () => {
    if (queue.length === 0) return;

    if (isRepeat) {
      seekTo(0);
      if (audioRef.current) audioRef.current.play().catch(console.warn);
      return;
    }

    let nextIndex = currentQueueIndex + 1;

    // Check if end of queue is reached
    if (nextIndex >= queue.length) {
      if (activePlaylistId && currentSong) {
        // Fallback to Autoplay microservice for next suggestion
        try {
          const autoplayRes = await api.getAutoplayNext(activePlaylistId, currentSong._id);
          if (autoplayRes && autoplayRes.nextSongId) {
            const nextSongDetails = await api.getSongDetails(autoplayRes.nextSongId);
            if (nextSongDetails && nextSongDetails.song) {
              const updatedQueue = [...queue, nextSongDetails.song];
              setQueue(updatedQueue);
              playSong(nextSongDetails.song, updatedQueue, activePlaylistId);
              return;
            }
          }
        } catch (err) {
          console.warn('Autoplay lookup failed:', err);
        }
      }

      // Default wraps around to start of queue
      nextIndex = 0;
    }

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    const nextTrackSong = queue[nextIndex];
    if (nextTrackSong) {
      playSong(nextTrackSong, queue, activePlaylistId);
    }
  };

  const prevTrack = () => {
    if (queue.length === 0) return;

    let prevIndex = currentQueueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevTrackSong = queue[prevIndex];
    if (prevTrackSong) {
      playSong(prevTrackSong, queue, activePlaylistId);
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
  };

  // Keep ref to latest nextTrack to avoid destroying player/audio element on queue/state updates
  const nextTrackRef = useRef<() => void>(nextTrack);
  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  // Stable ref for updateQualitySettings to use inside player event listeners
  const updateQualitySettingsRef = useRef(updateQualitySettings);
  useEffect(() => {
    updateQualitySettingsRef.current = updateQualitySettings;
  }, [updateQualitySettings]);

  // Initialize Audio Element & dash.js
  useEffect(() => {
    const audio = document.createElement('audio');
    audio.id = 'hotify-global-audio';
    audio.crossOrigin = 'anonymous'; // critical for CORS headers on manifests
    document.body.appendChild(audio);
    audioRef.current = audio;

    const player = dashjs.MediaPlayer().create();
    player.initialize(audio, '', false);
    playerRef.current = player;

    // Listeners for progress, play/pause
    const onTimeUpdate = () => {
      setPlaybackProgress(audio.currentTime);
    };

    const onDurationChange = () => {
      setPlaybackDuration(audio.duration || 0);
    };

    const onEnded = () => {
      // Auto-advance
      nextTrackRef.current();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    // Apply quality settings once the stream is initialized and representations are parsed
    const onStreamInitialized = () => {
      console.log('DASH: streamInitialized event fired, applying current quality:', playbackQualityRef.current);
      updateQualitySettingsRef.current(playbackQualityRef.current);
    };
    player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, onStreamInitialized);

    return () => {
      player.off(dashjs.MediaPlayer.events.STREAM_INITIALIZED, onStreamInitialized);
      player.destroy();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.remove();
    };
  }, []);

  // Mount logic
  useEffect(() => {
    checkAuthOnMount();
  }, []);

  // Global spacebar listener for play/pause toggle
  const togglePlayRef = useRef(togglePlay);
  useEffect(() => {
    togglePlayRef.current = togglePlay;
  }, [togglePlay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn || authStep !== 'dashboard') return;

      if (e.code === 'Space' || e.key === ' ') {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT' ||
            activeEl.getAttribute('contenteditable') === 'true')
        ) {
          return;
        }
        e.preventDefault();
        togglePlayRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoggedIn, authStep]);

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      authUrl,
      mainUrl,
      updateUrls,
      isLoggedIn,
      isCheckingAuth,
      userProfile,
      loginEmail,
      authStep,
      setAuthStep,
      setLoginEmail,
      checkAuthOnMount,
      handleLoginSuccess,
      logout,
      songs,
      playlists,
      refreshSongs,
      refreshPlaylists,
      searchQuery,
      setSearchQuery,
      searchResults,
      searchLoading,
      activeSection,
      setActiveSection,
      selectedPlaylistId,
      setSelectedPlaylistId,
      selectedSongId,
      setSelectedSongId,
      isAddModalOpen,
      setIsAddModalOpen,
      isCreateMenuOpen,
      setIsCreateMenuOpen,
      isMobileDrawerOpen,
      setIsMobileDrawerOpen,
      currentSong,
      isPlaying,
      volume,
      playbackProgress,
      playbackDuration,
      isShuffle,
      isRepeat,
      playbackQuality,
      setVolume,
      playSong,
      togglePlay,
      seekTo,
      nextTrack,
      prevTrack,
      setShuffle,
      setRepeat,
      setPlaybackQuality,
      isLyricsOpen,
      setIsLyricsOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
};
