import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Song, Playlist } from '../api';
import { api } from '../api';
import {
  Play,
  Pause,
  Shuffle,
  Search as SearchIcon,
  Trash2,
  Edit2,
  Plus,
  ShieldCheck,
  Music,
  Clock,
  Copy,
  Check,
  Upload,
  FileAudio,
  AlertCircle,
  X,
  History,
  Info
} from 'lucide-react';

export const MainContent: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    selectedPlaylistId,
    setSelectedPlaylistId,
    selectedSongId,
    setSelectedSongId,
    songs,
    playlists,
    refreshPlaylists,
    refreshSongs,
    playSong,
    currentSong,
    setShuffle,
    logout,
    userProfile,
    isPlaying,
    togglePlay
  } = useApp();

  useEffect(() => {
    if (currentSong) {
      const primary = currentSong.firstSinger || currentSong.singer || currentSong.artist;
      const second = currentSong.secondSinger;
      const singerStr = (primary && second) ? `${primary}, ${second}` : (primary || 'Unknown Singer');
      document.title = `${currentSong.title} • ${singerStr}`;
    } else {
      document.title = 'Hotify';
    }
  }, [currentSong]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getArtistName = (song: Song) => {
    const primary = song.firstSinger || song.singer;
    const others: string[] = [];
    if (song.otherSinger && Array.isArray(song.otherSinger)) {
      others.push(...song.otherSinger);
    }
    if (song.otherContribution && song.otherContribution !== 'not-mentioned') {
      others.push(song.otherContribution);
    }
    
    if (primary) {
      return others.length > 0 ? `${primary}, ${others.join(', ')}` : primary;
    }
    return others.length > 0 ? others.join(', ') : 'Unknown Artist';
  };

  const getSingerDisplay = (song: Song) => {
    const primary = song.firstSinger || song.singer || song.artist;
    const second = song.secondSinger;
    if (primary && second) {
      return `${primary}, ${second}`;
    }
    return primary || 'Unknown Singer';
  };

  // const getAlbumName = (song: Song) => {
  //   if (song.album) return song.album;
  //   if (song.albumName && song.albumName !== 'not-mentioned') return song.albumName;
  //   if (song.movieName && song.movieName !== 'not-mentioned') return song.movieName;
  //   return 'Single';
  // };

  const getDuration = (song: Song) => {
    if (song.duration) return song.duration;
    if (song.audioLength) {
      return song.audioLength > 1000 ? song.audioLength / 1000 : song.audioLength;
    }
    return 0;
  };

  const getYoutubeId = (url?: string) => {
    if (!url) return null;
    const watchMatch = url.match(/v=([^&#\s]+)/);
    if (watchMatch) return watchMatch[1];
    const shortMatch = url.match(/youtu\.be\/([^?&#\s]+)/);
    if (shortMatch) return shortMatch[1];
    const embedMatch = url.match(/embed\/([^?&#\s]+)/);
    if (embedMatch) return embedMatch[1];
    return null;
  };

  // Playlist actions states
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  
  // Track adding state
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);

  // Song detail states
  const [detailedSong, setDetailedSong] = useState<Song | null>(null);
  const [loadingSongDetail, setLoadingSongDetail] = useState(false);
  const [songLyrics, setSongLyrics] = useState<string | null>(null);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  const handleCopyLyrics = () => {
    if (songLyrics) {
      navigator.clipboard.writeText(songLyrics);
      setCopiedLyrics(true);
      setTimeout(() => setCopiedLyrics(false), 2000);
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isPlaylistRenameOpen, setIsPlaylistRenameOpen] = useState(false);
  const [isPlaylistDeleteOpen, setIsPlaylistDeleteOpen] = useState(false);
  const [playlistRenameValue, setPlaylistRenameValue] = useState('');

  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeActionSong, setSwipeActionSong] = useState<Song | null>(null);
  const [swipedSongId, setSwipedSongId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  const handleSwipeStart = (e: React.TouchEvent, songId: string) => {
    if (window.innerWidth > 768) return;
    setSwipeStartX(e.touches[0].clientX);
    setSwipedSongId(songId);
    setSwipeOffset(0);
  };

  const handleSwipeMove = (e: React.TouchEvent, songId: string) => {
    if (window.innerWidth > 768 || swipeStartX === null || swipedSongId !== songId) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeStartX;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100)); // Max swipe distance right
    } else if (activeSection === 'playlist-detail') {
      setSwipeOffset(Math.max(diff, -100)); // Max swipe distance left
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent, song: Song) => {
    if (window.innerWidth > 768 || swipeStartX === null || swipedSongId !== song._id) return;
    if (swipeOffset > 60) {
      setSwipeActionSong(song);
    } else if (swipeOffset < -60 && activeSection === 'playlist-detail') {
      handleRemoveSongFromPlaylist(song._id);
    }
    setSwipeStartX(null);
    setSwipedSongId(null);
    setSwipeOffset(0);
  };

  // Custom Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | null>(null);
  const toastTimerRef = useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastType(type);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      setToastType(null);
    }, 3000);
  };
  const [editFormData, setEditFormData] = useState({
    title: '',
    firstSinger: '',
    secondSinger: '',
    otherSinger: '',
    composer: '',
    musicLabel: '',
    movieName: '',
    actor: '',
    sourceUrl: '',
    language: '',
    originCountry: ''
  });

  const handleOpenEditModal = () => {
    if (!detailedSong) return;
    setEditFormData({
      title: detailedSong.title || '',
      firstSinger: detailedSong.firstSinger || detailedSong.singer || '',
      secondSinger: detailedSong.secondSinger || '',
      otherSinger: (detailedSong.otherSinger && detailedSong.otherSinger.length > 0) ? detailedSong.otherSinger.join(', ') : '',
      composer: (detailedSong.composer && detailedSong.composer.length > 0) ? detailedSong.composer.join(', ') : '',
      musicLabel: detailedSong.musicLabel || '',
      movieName: detailedSong.movieName || '',
      actor: (detailedSong.actor && detailedSong.actor.length > 0) ? detailedSong.actor.join(', ') : '',
      sourceUrl: detailedSong.sourceUrl || '',
      language: detailedSong.language || '',
      originCountry: detailedSong.originCountry || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (fieldName: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSaveSongDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedSong) return;

    const trimmedTitle = editFormData.title.trim();
    const trimmedFirstSinger = editFormData.firstSinger.trim();

    if (!trimmedTitle) {
      showToast('Song Title is required.', 'error');
      return;
    }
    if (!trimmedFirstSinger) {
      showToast('Primary Singer is required.', 'error');
      return;
    }

    setEditLoading(true);
    try {
      const updatedFields: { fieldName: string; info: string }[] = [];

      const addIfChanged = (fieldName: string, currentVal: string, originalVal: string) => {
        if (currentVal.trim() !== originalVal.trim()) {
          updatedFields.push({ fieldName, info: currentVal.trim() });
        }
      };

      addIfChanged('title', editFormData.title, detailedSong.title || '');
      addIfChanged('firstSinger', editFormData.firstSinger, detailedSong.firstSinger || detailedSong.singer || '');
      addIfChanged('secondSinger', editFormData.secondSinger, detailedSong.secondSinger || '');
      addIfChanged('musicLabel', editFormData.musicLabel, detailedSong.musicLabel || '');
      addIfChanged('movieName', editFormData.movieName, detailedSong.movieName || '');
      addIfChanged('sourceUrl', editFormData.sourceUrl, detailedSong.sourceUrl || '');
      addIfChanged('language', editFormData.language, detailedSong.language || '');
      addIfChanged('originCountry', editFormData.originCountry, detailedSong.originCountry || '');

      const origOtherSinger = (detailedSong.otherSinger && detailedSong.otherSinger.length > 0) ? detailedSong.otherSinger.join(', ') : '';
      addIfChanged('otherSinger', editFormData.otherSinger, origOtherSinger);

      const origComposer = (detailedSong.composer && detailedSong.composer.length > 0) ? detailedSong.composer.join(', ') : '';
      addIfChanged('composer', editFormData.composer, origComposer);

      const origActor = (detailedSong.actor && detailedSong.actor.length > 0) ? detailedSong.actor.join(', ') : '';
      addIfChanged('actor', editFormData.actor, origActor);

      if (updatedFields.length > 0) {
        await Promise.all(updatedFields.map(field => 
          api.updateSong(detailedSong._id, field.fieldName, field.info)
        ));

        const res = await api.getSongDetails(detailedSong._id);
        if (res) {
          if (res.songInfo) {
            setDetailedSong(res.songInfo);
          } else if (res.song) {
            setDetailedSong(res.song);
          }
        }
        await refreshSongs();
        showToast('Song details updated successfully!', 'success');
      }

      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update song details', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteSong = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteSong = async () => {
    if (!detailedSong) return;
    setDeleteLoading(true);
    try {
      await api.deleteSong(detailedSong._id);
      setIsDeleteConfirmOpen(false);
      showToast('Song deleted successfully!', 'success');
      await refreshSongs();
      if (window.history.state) {
        window.history.back();
      } else {
        setActiveSection('home');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete song', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // New Playlist creation screen states
  const [playlistName, setPlaylistName] = useState('');
  const [playlistLoading, setPlaylistLoading] = useState(false);

  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;

    setPlaylistLoading(true);
    try {
      const res = await api.createPlaylist(playlistName.trim());
      await refreshPlaylists();
      
      if (res && res.playlist && res.playlist._id) {
        setSelectedPlaylistId(res.playlist._id);
        setActiveSection('playlist-detail');
        showToast('Playlist created successfully!', 'success');
      } else {
        setActiveSection('home');
      }
      setPlaylistName('');
    } catch (err: any) {
      showToast(err.message || 'Failed to create playlist', 'error');
    } finally {
      setPlaylistLoading(false);
    }
  };

  // Song Upload state
  const [songTitle, setSongTitle] = useState('');
  const [songFirstSinger, setSongFirstSinger] = useState('');
  const [songSecondSinger, setSongSecondSinger] = useState('');
  const [songOtherSinger, setSongOtherSinger] = useState('');
  const [songComposer, setSongComposer] = useState('');
  const [songMusicLabel, setSongMusicLabel] = useState('');
  const [songMovieName, setSongMovieName] = useState('');
  const [songActor, setSongActor] = useState('');
  const [songSourceUrl, setSongSourceUrl] = useState('');
  const [songLanguage, setSongLanguage] = useState('');
  const [songOriginCountry, setSongOriginCountry] = useState('');
  const [songFile, setSongFile] = useState<File | null>(null);
  const [songLyricsText, setSongLyricsText] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Stream History States
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Uploaded Songs States
  const [uploadedSongs, setUploadedSongs] = useState<Song[]>([]);
  const [loadingUploadedSongs, setLoadingUploadedSongs] = useState(false);

  // Search History States
  const [searchHistoryList, setSearchHistoryList] = useState<any[]>([]);
  const [searchHistoryLoading, setSearchHistoryLoading] = useState(false);

  const fetchSearchHistory = async () => {
    setSearchHistoryLoading(true);
    try {
      const res = await api.getSearchHistory() as any;
      const list = res.info || res.result || res.history || res.data || (Array.isArray(res) ? res : []);
      setSearchHistoryList(list);
    } catch (err) {
      console.error('Failed to fetch search history:', err);
    } finally {
      setSearchHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection !== 'search') return;
    fetchSearchHistory();
  }, [activeSection, currentSong]);

  // Close the song playlist popover when clicking anywhere else
  useEffect(() => {
    if (activeMenuSongId === null) return;

    const handleOutsideClick = () => {
      setActiveMenuSongId(null);
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeMenuSongId]);

  // Load uploaded songs on profile section active
  useEffect(() => {
    if (activeSection !== 'profile-settings') return;

    const fetchUploadedSongs = async () => {
      setLoadingUploadedSongs(true);
      try {
        const res = await api.getUploadedSongs();
        console.log('GET /song/all/admin response:', res);
        const songsList = res.info || res.result || res.songs || res.data || (Array.isArray(res) ? res : []);
        setUploadedSongs(songsList);
      } catch (err) {
        console.error('Failed to fetch uploaded songs:', err);
      } finally {
        setLoadingUploadedSongs(false);
      }
    };

    fetchUploadedSongs();
  }, [activeSection]);

  // Fetch history details helper
  const fetchHistoryData = async (page: number, isInitial: boolean) => {
    setHistoryLoading(true);
    try {
      const res = await api.getStreamHistory(page, 7);
      if (res && res.success && Array.isArray(res.result)) {
        if (res.result.length === 0) {
          setHasMoreHistory(false);
        } else {
          setHistoryList(prev => {
            const nextList = isInitial ? res.result : [...prev, ...res.result];
            if (res.result.length < 7) {
              setHasMoreHistory(false);
            }
            return nextList;
          });
        }
      } else {
        setHasMoreHistory(false);
      }
    } catch (err) {
      console.error('Failed to fetch stream history:', err);
      setHasMoreHistory(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load page 1 on history active section
  useEffect(() => {
    if (activeSection !== 'history') return;
    setHistoryList([]);
    setHistoryPage(1);
    setHasMoreHistory(true);
    fetchHistoryData(1, true);
  }, [activeSection]);

  const loadMoreHistory = () => {
    if (historyLoading || !hasMoreHistory) return;
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    fetchHistoryData(nextPage, false);
  };

  const resolveFullSong = (entrySong: any) => {
    if (!entrySong) return null;
    const full = songs.find(s => s._id === entrySong._id);
    if (full) return full;
    return {
      _id: entrySong._id,
      title: entrySong.title,
      firstSinger: entrySong.firstSinger,
      singer: entrySong.firstSinger,
      artist: entrySong.firstSinger,
      duration: 195,
      coverUrl: undefined
    } as Song;
  };

  const formatDateHeading = (dateStr: string) => {
    if (!dateStr) return 'Unknown Date';
    const date = new Date(dateStr);
    const now = new Date();
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatPlayTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const formatUploadTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} \u00A0\u00A0 ${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const handleSongFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSongFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleSongUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!songFile) {
      setUploadError('Please select an audio file to upload.');
      return;
    }
    if (!songTitle.trim()) {
      setUploadError('Please enter a title.');
      return;
    }
    if (!songFirstSinger.trim()) {
      setUploadError('Please enter the primary singer.');
      return;
    }

    setUploadError(null);
    setUploadLoading(true);

    const formData = new FormData();
    formData.append('song', songFile);
    if (songLyricsText.trim()) {
      formData.append('lyrics', songLyricsText.trim());
    }
    formData.append('title', songTitle.trim());
    formData.append('firstSinger', songFirstSinger.trim());

    if (songSecondSinger.trim()) {
      formData.append('secondSinger', songSecondSinger.trim());
    }
    if (songMusicLabel.trim()) {
      formData.append('musicLabel', songMusicLabel.trim());
    }
    if (songMovieName.trim()) {
      formData.append('movieName', songMovieName.trim());
    }
    if (songSourceUrl.trim()) {
      formData.append('sourceUrl', songSourceUrl.trim());
    }
    if (songLanguage.trim()) {
      formData.append('language', songLanguage.trim());
    }
    if (songOriginCountry.trim()) {
      formData.append('originCountry', songOriginCountry.trim());
    }

    // Split array fields by comma, trim them, and append individually
    if (songOtherSinger.trim()) {
      songOtherSinger.split(',').forEach(s => {
        const val = s.trim();
        if (val) formData.append('otherSinger', val);
      });
    }
    if (songComposer.trim()) {
      songComposer.split(',').forEach(c => {
        const val = c.trim();
        if (val) formData.append('composer', val);
      });
    }
    if (songActor.trim()) {
      songActor.split(',').forEach(a => {
        const val = a.trim();
        if (val) formData.append('actor', val);
      });
    }

    try {
      await api.uploadSong(formData);
      await refreshSongs();
      showToast('Song uploaded successfully!', 'success');
      
      // Reset state
      setSongTitle('');
      setSongFirstSinger('');
      setSongSecondSinger('');
      setSongOtherSinger('');
      setSongComposer('');
      setSongMusicLabel('');
      setSongMovieName('');
      setSongActor('');
      setSongSourceUrl('');
      setSongLanguage('');
      setSongOriginCountry('');
      setSongFile(null);
      setSongLyricsText('');
      
      setActiveSection('home');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload song.');
    } finally {
      setUploadLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection !== 'song-detail' || !selectedSongId) return;

    const fetchSongDetail = async () => {
      setLoadingSongDetail(true);
      try {
        const res = await api.getSongDetails(selectedSongId);
        if (res) {
          if (res.songInfo) {
            setDetailedSong(res.songInfo);
          } else if (res.song) {
            setDetailedSong(res.song);
          }
          if (res.lyricsInfo && res.lyricsInfo.lyrics) {
            setSongLyrics(res.lyricsInfo.lyrics);
          } else {
            setSongLyrics(null);
          }
        }
      } catch (err) {
        console.error('Error fetching song details:', err);
      } finally {
        setLoadingSongDetail(false);
      }
    };

    fetchSongDetail();
  }, [selectedSongId, activeSection]);



  // Load Playlist Songs detail from API
  useEffect(() => {
    if (activeSection !== 'playlist-detail' || !selectedPlaylistId) return;

    const fetchPlaylistDetails = async () => {
      try {
        const res = await api.getPlaylistDetails(selectedPlaylistId);
        if (res && res.success && res.playlist) {
          setSelectedPlaylist(res.playlist);
          // Parse songs inside playlist.songs which are of shape { songId: Song | null, _id: string, added: string }
          const validSongs: Song[] = [];
          if (res.playlist.songs && Array.isArray(res.playlist.songs)) {
            res.playlist.songs.forEach((item: any) => {
              if (item.songId && typeof item.songId === 'object') {
                validSongs.push(item.songId);
              }
            });
          }
          setPlaylistSongs(validSongs);
        }
      } catch (err) {
        console.error('Error loading playlist details:', err);
      }
    };

    fetchPlaylistDetails();
  }, [selectedPlaylistId, activeSection, playlists]);

  const handlePlayAll = (trackList: Song[]) => {
    if (trackList.length > 0) {
      playSong(trackList[0], trackList, selectedPlaylistId);
    }
  };

  const handleShufflePlay = (trackList: Song[]) => {
    if (trackList.length > 0) {
      setShuffle(true);
      const randomIndex = Math.floor(Math.random() * trackList.length);
      playSong(trackList[randomIndex], trackList, selectedPlaylistId);
    }
  };

  // Add song to playlist
  const handleAddSongToPlaylist = async (playlistId: string, songId: string) => {
    try {
      await api.addSongToPlaylist(playlistId, songId);
      await refreshPlaylists();
      setActiveMenuSongId(null);
      showToast('Song added to playlist!', 'success');
    } catch (err) {
      showToast('Error adding song to playlist', 'error');
    }
  };

  // Remove song from playlist
  const handleRemoveSongFromPlaylist = async (songId: string) => {
    if (!selectedPlaylistId) return;
    try {
      await api.deleteSongFromPlaylist(selectedPlaylistId, songId);
      await refreshPlaylists();
      showToast('Song removed from playlist', 'success');
    } catch (err) {
      showToast('Error removing song', 'error');
    }
  };

  // Delete Playlist
  const handleDeletePlaylist = async () => {
    if (!selectedPlaylistId) return;
    setIsPlaylistDeleteOpen(true);
  };

  const handlePlaylistDeleteSubmit = async () => {
    if (!selectedPlaylistId) return;
    try {
      await api.deletePlaylist(selectedPlaylistId);
      await refreshPlaylists();
      setIsPlaylistDeleteOpen(false);
      setActiveSection('home');
      showToast('Playlist deleted successfully!', 'success');
    } catch (err) {
      showToast('Error deleting playlist', 'error');
    }
  };

  // Rename Playlist
  const handleRenamePlaylist = async () => {
    if (!selectedPlaylistId || !selectedPlaylist) return;
    setPlaylistRenameValue(selectedPlaylist.name);
    setIsPlaylistRenameOpen(true);
  };

  const handlePlaylistRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaylistId || !playlistRenameValue.trim()) return;
    try {
      await api.renamePlaylist(selectedPlaylistId, playlistRenameValue.trim());
      await refreshPlaylists();
      setSelectedPlaylist(prev => prev ? { ...prev, name: playlistRenameValue.trim() } : null);
      setIsPlaylistRenameOpen(false);
      showToast('Playlist renamed successfully!', 'success');
    } catch (err) {
      showToast('Error renaming playlist', 'error');
    }
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return '3:15';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="main-view" style={{ flex: 1 }} onScroll={(e) => {
      if (activeSection === 'history') {
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 150) {
          loadMoreHistory();
        }
      }
    }}>

      {/* Main content scroll container */}
      <div className="content-wrapper">

        {/* 1. HOME SCREEN */}
        {activeSection === 'home' && (
          <div>
            <h1 className="page-title" style={{ marginBottom: '24px' }}>{getGreeting()}</h1>

            {songs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px'
              }}>
                No songs uploaded in the backend server yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <table className="songs-table">
                  <thead>
                    <tr>
                      <th className="index-cell" style={{ width: '60px', textAlign: 'center' }}>#</th>
                      <th style={{ textAlign: 'left' }}>Title</th>
                      <th className="mobile-singer-cell" style={{ textAlign: 'left' }}>Singer</th>
                      <th className="hide-on-mobile" style={{ textAlign: 'left' }}>Uploaded By</th>
                      <th className="time-cell hide-on-mobile" style={{ width: '160px', textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>
                        Upload Time
                      </th>
                      <th className="song-actions-cell" style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {songs.map((song, idx) => {
                      const isCurrent = currentSong?._id === song._id;
                      return (
                        <tr
                          key={song._id}
                          className={`song-row ${isCurrent ? 'active' : ''} ${swipedSongId === song._id && swipeStartX !== null ? 'swiping' : ''}`}
                          style={{ '--swipe-offset': swipedSongId === song._id ? `${swipeOffset}px` : '0px', '--swipe-opacity': swipedSongId === song._id && swipeOffset > 0 ? 1 : 0, '--swipe-left-opacity': swipedSongId === song._id && swipeOffset < 0 ? 1 : 0 } as React.CSSProperties}
                          onTouchStart={(e) => handleSwipeStart(e, song._id)}
                          onTouchMove={(e) => handleSwipeMove(e, song._id)}
                          onTouchEnd={(e) => handleSwipeEnd(e, song)}
                          onClick={() => {
                            playSong(song, songs);
                          }}
                          className={`song-row ${isCurrent ? 'active' : ''}`}
                        >
                          <td className="index-cell" style={{ width: '60px', textAlign: 'center' }}>
                            {isCurrent ? (
                              <div className={`playing-animation ${!isPlaying ? 'paused' : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                            ) : (
                              <span className="song-index">{idx + 1}</span>
                            )}
                          </td>
                          <td className="title-cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {/* Thumbnail cover image */}
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '4px',
                                backgroundColor: '#282828',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                cursor: 'pointer',
                                background: song.coverUrl ? `url(${song.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1db954 0%, #191414 100%)'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSongId(song._id);
                                setActiveSection('song-detail');
                              }}>
                                {!song.coverUrl && <Music size={18} style={{ color: '#fff' }} />}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                                <span className="song-title-main" style={{
                                  fontWeight: 600,
                                  color: isCurrent ? 'var(--accent-green)' : 'var(--text-main)',
                                  fontSize: '0.95rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSongId(song._id);
                                  setActiveSection('song-detail');
                                }}
                                >
                                  {song.title}
                                </span>
                                <span className="song-artist-sub hide-on-mobile" style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '4px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {getArtistName(song)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="mobile-singer-cell" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            <span className="hide-on-mobile">{getSingerDisplay(song)}</span>
                            <span className="show-on-mobile" style={{ display: 'none' }}>{getSingerDisplay(song).split(',')[0]}</span>
                          </td>
                          <td className="hide-on-mobile" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            {song.uploadedBy || 'Unknown'}
                          </td>
                          <td className="time-cell hide-on-mobile" style={{ width: '160px', textAlign: 'right', paddingRight: '24px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {song.createdAt ? formatUploadTime(song.createdAt) : 'Unknown'}
                          </td>
                          <td className="song-actions-cell" onClick={(e) => e.stopPropagation()} style={{ width: '60px', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                className="show-on-mobile icon-btn-small"
                                onClick={(e) => { e.stopPropagation(); setSelectedSongId(song._id); setActiveSection('song-detail'); }}
                                style={{ display: 'none', color: 'var(--text-secondary)', padding: '4px', borderRadius: '50%' }}
                                title="Information"
                              >
                                <Info size={18} />
                              </button>
                              <button
                                onClick={() => setActiveMenuSongId(activeMenuSongId === song._id ? null : song._id)}
                                style={{
                                  color: 'var(--text-secondary)',
                                  padding: '4px',
                                  borderRadius: '50%',
                                  transition: 'color 0.2s'
                                }}
                                className="icon-btn-small hide-on-mobile"
                                title="Add to Playlist"
                              >
                                <Plus size={16} />
                              </button>

                              {/* Playlist Dropdown */}
                              {activeMenuSongId === song._id && playlists.length > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  right: '60px',
                                  bottom: '10px',
                                  backgroundColor: 'var(--bg-card)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '6px',
                                  padding: '8px',
                                  zIndex: 10,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                  minWidth: '150px'
                                }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', display: 'block', color: 'var(--text-muted)' }}>
                                    Add to Playlist
                                  </span>
                                  {playlists.map(p => (
                                    <button
                                      key={p._id}
                                      onClick={() => handleAddSongToPlaylist(p._id, song._id)}
                                      style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '6px 8px',
                                        fontSize: '0.8rem',
                                        borderRadius: '4px',
                                        display: 'block',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer'
                                      }}
                                      className="song-row"
                                    >
                                      {p.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LISTENING HISTORY SCREEN */}
        {activeSection === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                  Recently Played
                </span>
                <h1 className="page-title" style={{ marginTop: '4px', marginBottom: 0 }}>Listening History</h1>
              </div>
            </div>

            {historyList.length === 0 && !historyLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 24px',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
              }}>
                <History size={48} style={{ opacity: 0.4, color: 'var(--text-secondary)' }} />
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>No listening history yet</h3>
                <p style={{ fontSize: '0.88rem', margin: 0, maxWidth: '300px', lineHeight: '1.4' }}>
                  Songs you play on Hotify will show up here.
                </p>
                <button
                  onClick={() => setActiveSection('home')}
                  style={{
                    background: 'var(--accent-green)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    marginTop: '8px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  Explore Songs
                </button>
              </div>
            ) : (() => {
              // Group historyList by formatted date heading
              const groupedHistory: { dateHeading: string; entries: any[] }[] = [];
              historyList.forEach(entry => {
                const heading = formatDateHeading(entry.createdAt);
                let group = groupedHistory.find(g => g.dateHeading === heading);
                if (!group) {
                  group = { dateHeading: heading, entries: [] };
                  groupedHistory.push(group);
                }
                group.entries.push(entry);
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {groupedHistory.map((group) => (
                    <div key={group.dateHeading}>
                      <h2 style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginBottom: '16px',
                        fontFamily: 'var(--font-family)',
                        letterSpacing: '-0.5px'
                      }}>
                        {group.dateHeading}
                      </h2>
                      <table className="songs-table">
                        <thead>
                          <tr>
                            <th className="index-cell hide-on-mobile" style={{ width: '60px', textAlign: 'center' }}>#</th>
                            <th style={{ textAlign: 'left' }}>Title</th>
                            <th className="hide-on-mobile" style={{ textAlign: 'left' }}>Singer</th>
                            <th className="hide-on-mobile" style={{ textAlign: 'left' }}>Uploaded By</th>
                            <th className="time-cell" style={{ width: '100px', textAlign: 'right', paddingRight: '24px' }}>
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.entries.map((entry, idx) => {
                            const fullSong = resolveFullSong(entry.song);
                            if (!fullSong) return null;
                            const isCurrent = currentSong?._id === fullSong._id;
                            return (
                              <tr
                                key={`${entry._id}-${idx}`}
                                className={`song-row ${isCurrent ? 'active' : ''} ${swipedSongId === fullSong._id && swipeStartX !== null ? 'swiping' : ''}`}
                                style={{ '--swipe-offset': swipedSongId === fullSong._id ? `${swipeOffset}px` : '0px', '--swipe-opacity': swipedSongId === fullSong._id && swipeOffset > 0 ? 1 : 0, '--swipe-left-opacity': swipedSongId === fullSong._id && swipeOffset < 0 ? 1 : 0 } as React.CSSProperties}
                                onTouchStart={(e) => handleSwipeStart(e, fullSong._id)}
                                onTouchMove={(e) => handleSwipeMove(e, fullSong._id)}
                                onTouchEnd={(e) => handleSwipeEnd(e, fullSong)}
                                onClick={() => {
                                  const allSongs = historyList.map(item => resolveFullSong(item.song)).filter((s): s is Song => s !== null);
                                  playSong(fullSong, allSongs);
                                }}
                                className={`song-row ${isCurrent ? 'active' : ''}`}
                              >
                                <td className="index-cell hide-on-mobile" style={{ width: '60px', textAlign: 'center' }}>
                                  {isCurrent ? (
                                    <div className={`playing-animation ${!isPlaying ? 'paused' : ''}`}>
                                      <span></span>
                                      <span></span>
                                      <span></span>
                                      <span></span>
                                    </div>
                                  ) : (
                                    <span className="song-index">{idx + 1}</span>
                                  )}
                                </td>
                                <td className="title-cell">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '4px',
                                      backgroundColor: '#282828',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      background: fullSong.coverUrl ? `url(${fullSong.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1db954 0%, #191414 100%)'
                                    }}>
                                      {!fullSong.coverUrl && <Music size={18} style={{ color: '#fff' }} />}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                                      <span className="song-title-main" style={{
                                        fontWeight: 600,
                                        color: isCurrent ? 'var(--accent-green)' : 'var(--text-main)',
                                        fontSize: '0.95rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        cursor: 'pointer'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSongId(fullSong._id);
                                        setActiveSection('song-detail');
                                      }}
                                      >
                                        {fullSong.title}
                                      </span>
                                      <span className="song-artist-sub" style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        marginTop: '4px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {getArtistName(fullSong)}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="hide-on-mobile" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                  {getSingerDisplay(fullSong)}
                                </td>
                                <td className="hide-on-mobile" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                  {fullSong.uploadedBy || 'Unknown'}
                                </td>
                                <td className="time-cell" style={{ width: '100px', textAlign: 'right', paddingRight: '24px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                  {formatPlayTime(entry.createdAt)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  {historyLoading && (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Loading more history...
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* 2. SEARCH SCREEN */}
        {activeSection === 'search' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>Search History</h1>
            </div>

            {searchHistoryLoading && searchHistoryList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                Loading search history...
              </div>
            ) : searchHistoryList.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 24px',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
              }}>
                <SearchIcon size={48} style={{ opacity: 0.4, color: 'var(--text-secondary)' }} />
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>No search history yet</h3>
                <p style={{ fontSize: '0.88rem', margin: 0, maxWidth: '300px', lineHeight: '1.4' }}>
                  Your search history will appear here once you play songs from search suggestions.
                </p>
              </div>
            ) : (
              <table className="songs-table">
                <thead>
                  <tr>
                    {/* Desktop Headers */}
                    <th className="index-cell hide-on-mobile" style={{ width: '60px', textAlign: 'center' }}>#</th>
                    <th className="hide-on-mobile" style={{ textAlign: 'left' }}>Result Played</th>
                    <th className="mobile-singer-cell hide-on-mobile" style={{ textAlign: 'left' }}>Singer</th>
                    <th className="time-cell hide-on-mobile" style={{ width: '120px', textAlign: 'left' }}>
                      Time
                    </th>
                    <th className="hide-on-mobile" style={{ textAlign: 'right', paddingRight: '24px' }}>Search Query</th>

                    {/* Mobile Headers */}
                    <th className="show-on-mobile-table-cell" style={{ textAlign: 'left', paddingLeft: '16px' }}>Result Played</th>
                    <th className="show-on-mobile-table-cell" style={{ textAlign: 'right', paddingRight: '16px' }}>Search Query</th>
                  </tr>
                </thead>
                <tbody>
                  {searchHistoryList.map((entry, idx) => {
                    const songData = entry.result || entry.songId;
                    const resolvedSong = typeof songData === 'object' && songData 
                      ? songData 
                      : songs.find((s: any) => s._id === songData);
                    
                    const isCurrent = currentSong && resolvedSong && currentSong._id === resolvedSong._id;
                    return (
                      <tr
                        key={entry._id || idx}
                        className={`song-row ${isCurrent ? 'active' : ''} ${resolvedSong && swipedSongId === resolvedSong._id && swipeStartX !== null ? 'swiping' : ''}`}
                        style={{ cursor: resolvedSong ? 'pointer' : 'default', '--swipe-offset': resolvedSong && swipedSongId === resolvedSong._id ? `${swipeOffset}px` : '0px', '--swipe-opacity': resolvedSong && swipedSongId === resolvedSong._id && swipeOffset > 0 ? 1 : 0, '--swipe-left-opacity': resolvedSong && swipedSongId === resolvedSong._id && swipeOffset < 0 ? 1 : 0 } as React.CSSProperties}
                        onTouchStart={(e) => { if (resolvedSong) handleSwipeStart(e, resolvedSong._id); }}
                        onTouchMove={(e) => { if (resolvedSong) handleSwipeMove(e, resolvedSong._id); }}
                        onTouchEnd={(e) => { if (resolvedSong) handleSwipeEnd(e, resolvedSong); }}
                        onClick={() => {
                          if (resolvedSong) {
                            playSong(resolvedSong, songs);
                          }
                        }}
                        className={`song-row ${isCurrent ? 'active' : ''}`}
                        style={{ cursor: resolvedSong ? 'pointer' : 'default' }}
                      >
                        {/* Desktop Cells */}
                        <td className="index-cell hide-on-mobile" style={{ width: '60px', textAlign: 'center' }}>
                          {idx + 1}
                        </td>
                        <td className="title-cell hide-on-mobile">
                          {resolvedSong ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '4px',
                                backgroundColor: '#282828',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: resolvedSong.coverUrl ? `url(${resolvedSong.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1db954 0%, #191414 100%)'
                              }}>
                                {!resolvedSong.coverUrl && <Music size={18} style={{ color: '#fff' }} />}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <span style={{
                                  fontWeight: 600,
                                  color: isCurrent ? 'var(--accent-green)' : 'var(--text-main)',
                                  fontSize: '0.95rem'
                                }}>
                                  {resolvedSong.title}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                              Deleted Song ({typeof songData === 'string' ? songData : (songData?._id || 'Unknown')})
                            </span>
                          )}
                        </td>
                        <td className="hide-on-mobile" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                          {resolvedSong ? getSingerDisplay(resolvedSong) : 'N/A'}
                        </td>
                        <td className="time-cell hide-on-mobile" style={{ width: '120px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                          {entry.createdAt ? `${formatDateHeading(entry.createdAt)} at ${formatPlayTime(entry.createdAt)}` : 'N/A'}
                        </td>
                        <td className="hide-on-mobile" style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', textAlign: 'right', paddingRight: '24px' }}>
                          "{entry.searchItem}"
                        </td>

                        {/* Mobile Cells */}
                        <td className="title-cell show-on-mobile-table-cell" style={{ paddingLeft: '16px' }}>
                          {resolvedSong ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '4px',
                                backgroundColor: '#282828',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: resolvedSong.coverUrl ? `url(${resolvedSong.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1db954 0%, #191414 100%)'
                              }}>
                                {!resolvedSong.coverUrl && <Music size={18} style={{ color: '#fff' }} />}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <span style={{
                                  fontWeight: 600,
                                  color: isCurrent ? 'var(--accent-green)' : 'var(--text-main)',
                                  fontSize: '0.95rem'
                                }}>
                                  {resolvedSong.title}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                              Deleted Song
                            </span>
                          )}
                        </td>
                        <td className="show-on-mobile-table-cell" style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.92rem', textAlign: 'right', paddingRight: '16px' }}>
                          "{entry.searchItem}"
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 3. PLAYLIST DETAIL SCREEN */}
        {activeSection === 'playlist-detail' && selectedPlaylist && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Playlist
                </span>
                <h1 className="page-title" style={{ marginTop: '4px' }}>{selectedPlaylist.name}</h1>
                <div className="songs-count">{playlistSongs.length} songs</div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleRenamePlaylist}
                  className="icon-btn"
                  title="Rename Playlist"
                  style={{ border: '1px solid var(--border-color)' }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={handleDeletePlaylist}
                  className="icon-btn"
                  title="Delete Playlist"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--accent-red)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="action-bar">
              {(() => {
                const isCurrentPlaylist = currentSong && playlistSongs.some(s => s._id === currentSong._id);
                const isPlaylistPlaying = isCurrentPlaylist && isPlaying;
                return (
                  <button
                    disabled={playlistSongs.length === 0}
                    onClick={() => {
                      if (isCurrentPlaylist) {
                        togglePlay();
                      } else {
                        handlePlayAll(playlistSongs);
                      }
                    }}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: playlistSongs.length === 0 ? 0.6 : 1 }}
                  >
                    {isPlaylistPlaying ? (
                      <>
                        <Pause size={16} fill="currentColor" /> Pause
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="currentColor" /> Play All
                      </>
                    )}
                  </button>
                );
              })()}
              <button
                disabled={playlistSongs.length === 0}
                onClick={() => handleShufflePlay(playlistSongs)}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: playlistSongs.length === 0 ? 0.6 : 1 }}
              >
                <Shuffle size={14} /> Shuffle
              </button>
            </div>

            {playlistSongs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                lineHeight: '1.6'
              }}>
                <h3>This playlist is empty.</h3>
                <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Go to Home, click "+" next to a track to add it here!</p>
              </div>
            ) : (
               <table className="songs-table">
                <thead>
                  <tr>
                    <th className="index-cell" style={{ width: '60px', textAlign: 'center' }}>#</th>
                    <th style={{ textAlign: 'left' }}>Title</th>
                    <th className="mobile-singer-cell" style={{ textAlign: 'left' }}>Singer</th>
                    <th className="hide-on-mobile" style={{ textAlign: 'left' }}>Uploaded By</th>
                    <th className="time-cell hide-on-mobile" style={{ width: '100px', textAlign: 'right', paddingRight: '24px' }}>
                      <Clock size={16} />
                    </th>
                    <th className="song-actions-cell" style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {playlistSongs.map((song, idx) => {
                    const isCurrent = currentSong?._id === song._id;
                    return (
                      <tr
                        key={song._id}
                        className={`song-row ${isCurrent ? 'active' : ''} ${swipedSongId === song._id && swipeStartX !== null ? 'swiping' : ''}`}
                        style={{ '--swipe-offset': swipedSongId === song._id ? `${swipeOffset}px` : '0px', '--swipe-opacity': swipedSongId === song._id && swipeOffset > 0 ? 1 : 0, '--swipe-left-opacity': swipedSongId === song._id && swipeOffset < 0 ? 1 : 0 } as React.CSSProperties}
                        onTouchStart={(e) => handleSwipeStart(e, song._id)}
                        onTouchMove={(e) => handleSwipeMove(e, song._id)}
                        onTouchEnd={(e) => handleSwipeEnd(e, song)}
                        onClick={() => {
                          playSong(song, playlistSongs, selectedPlaylistId);
                        }}
                        className={`song-row ${isCurrent ? 'active' : ''}`}
                      >
                        <td className="index-cell" style={{ width: '60px', textAlign: 'center' }}>
                          {isCurrent ? (
                            <div className={`playing-animation ${!isPlaying ? 'paused' : ''}`}>
                              <span></span>
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          ) : (
                            <span className="song-index">{idx + 1}</span>
                          )}
                        </td>
                        <td className="title-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '4px',
                              backgroundColor: '#282828',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              cursor: 'pointer',
                              background: song.coverUrl ? `url(${song.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1db954 0%, #191414 100%)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSongId(song._id);
                              setActiveSection('song-detail');
                            }}>
                              {!song.coverUrl && <Music size={18} style={{ color: '#fff' }} />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                              <span className="song-title-main" style={{
                                fontWeight: 600,
                                color: isCurrent ? 'var(--accent-green)' : 'var(--text-main)',
                                fontSize: '0.95rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSongId(song._id);
                                setActiveSection('song-detail');
                              }}
                              >{song.title}</span>
                              <span className="song-artist-sub" style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                marginTop: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>{getArtistName(song)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="mobile-singer-cell" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                          <span className="hide-on-mobile">{getSingerDisplay(song)}</span>
                          <span className="show-on-mobile" style={{ display: 'none' }}>{getSingerDisplay(song).split(',')[0]}</span>
                        </td>
                        <td className="hide-on-mobile" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                          {song.uploadedBy || 'Unknown'}
                        </td>
                        <td className="time-cell hide-on-mobile" style={{ width: '100px', textAlign: 'right', paddingRight: '24px', color: 'var(--text-secondary)' }}>
                          {formatDuration(getDuration(song))}
                        </td>
                        <td className="song-actions-cell" onClick={(e) => e.stopPropagation()} style={{ width: '60px' }}>
                          <button
                            className="show-on-mobile"
                            onClick={(e) => { e.stopPropagation(); setSelectedSongId(song._id); setActiveSection('song-detail'); }}
                            style={{ display: 'none', color: 'var(--text-secondary)', padding: '8px' }}
                            title="Information"
                          >
                            <Info size={18} />
                          </button>
                          <button
                            onClick={() => handleRemoveSongFromPlaylist(song._id)}
                            style={{ color: 'var(--text-secondary)', padding: '4px' }}
                            className="actions-menu-trigger hide-on-mobile"
                            title="Remove from Playlist"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* SONG DETAIL SCREEN */}
        {activeSection === 'song-detail' && (
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 0' }}>
            {loadingSongDetail ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                Loading song details...
              </div>
            ) : !detailedSong ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                Song details not found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Back link */}
                <button
                  onClick={() => {
                    if (window.history.state) {
                      window.history.back();
                    } else {
                      setActiveSection('home');
                    }
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  &larr; Back
                </button>

                {/* Central Large Image */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <div style={{
                    width: '320px',
                    height: '320px',
                    borderRadius: '12px',
                    background: detailedSong.coverUrl 
                      ? `url(${detailedSong.coverUrl}) center/cover no-repeat` 
                      : 'linear-gradient(135deg, #1db954 0%, #191414 100%)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    position: 'relative'
                  }}>
                    {!detailedSong.coverUrl && (
                      <Music size={80} style={{ opacity: 0.8 }} />
                    )}
                  </div>
                </div>

                {/* Title and Artists block (Centered) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
                  <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    letterSpacing: '-1px',
                    margin: '0 0 8px 0',
                    lineHeight: '1.2',
                    textAlign: 'center'
                  }}>
                    {detailedSong.title}
                  </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    margin: '0',
                    fontWeight: 500,
                    textAlign: 'center'
                  }}>
                    {getArtistName(detailedSong)}
                  </p>
                </div>

                {/* Credits & Details Card */}
                <div style={{
                  backgroundColor: '#1f1f1f',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div style={{ width: '28px' }}></div> {/* Spacer to balance edit button for exact centering */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', textAlign: 'center' }}>Song Credits & Details</h3>
                    <button
                      onClick={handleOpenEditModal}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#b38728',
                        opacity: 0.8,
                        borderRadius: '50%',
                        transition: 'all 0.2s ease',
                      }}
                      title="Edit Song Details"
                      className="icon-btn-edit-details"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'center' }}>
                    {/* Song ID */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>songId</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{detailedSong._id}</span>
                    </div>

                    {/* Primary Singer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Primary Singer</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {detailedSong.firstSinger || detailedSong.singer || 'Unknown'}
                      </span>
                    </div>

                    {/* Supporting Singer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Supporting Singer</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: detailedSong.secondSinger ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                        {detailedSong.secondSinger || 'None'}
                      </span>
                    </div>

                    {/* Movie/Album */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Movie / Album</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: detailedSong.movieName ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                        {detailedSong.movieName || 'None'}
                      </span>
                    </div>

                    {/* Featured Artists */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Featured Artists</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: (detailedSong.otherSinger && detailedSong.otherSinger.length > 0) ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                        {(detailedSong.otherSinger && detailedSong.otherSinger.length > 0) ? detailedSong.otherSinger.join(', ') : 'None'}
                      </span>
                    </div>

                    {/* Composer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Composer</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: (detailedSong.composer && detailedSong.composer.length > 0) ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                        {(detailedSong.composer && detailedSong.composer.length > 0) ? detailedSong.composer.join(', ') : 'None'}
                      </span>
                    </div>

                    {/* Actors */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Actor / Cast</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: (detailedSong.actor && detailedSong.actor.length > 0) ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                        {(detailedSong.actor && detailedSong.actor.length > 0) ? detailedSong.actor.join(', ') : 'None'}
                      </span>
                    </div>

                    {/* Music Label */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Music Label</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: detailedSong.musicLabel ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                        {detailedSong.musicLabel || 'None'}
                      </span>
                    </div>

                    {/* Language */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Language</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: detailedSong.language ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                        {detailedSong.language || 'None'}
                      </span>
                    </div>

                    {/* Country of Origin */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Country</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: detailedSong.originCountry ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                        {detailedSong.originCountry || 'None'}
                      </span>
                    </div>

                    {/* Duration */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Duration</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{formatDuration(getDuration(detailedSong))}</span>
                    </div>

                    {/* Audio Format */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Audio Format</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{(detailedSong.uploadedAudioFormat || 'MP3').toUpperCase()}</span>
                    </div>
                  </div>

                  {/* YouTube Video / Source Link */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '20px',
                    marginTop: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Source / Video</span>
                    </div>

                    {detailedSong.sourceUrl ? (
                      getYoutubeId(detailedSong.sourceUrl) ? (
                        <div style={{
                          width: '100%',
                          maxWidth: '480px',
                          aspectRatio: '16/9',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-color)',
                          marginTop: '4px'
                        }}>
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${getYoutubeId(detailedSong.sourceUrl)}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{ border: 'none' }}
                          ></iframe>
                        </div>
                      ) : (
                        <a href={detailedSong.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.95rem', color: 'var(--accent-green)', wordBreak: 'break-all', textDecoration: 'none', fontWeight: 600 }}>
                          {detailedSong.sourceUrl}
                        </a>
                      )
                    ) : null}
                  </div>
                </div>

                {/* Song Lyrics Section */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  padding: '16px 8px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '12px'
                  }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Song Lyrics</h3>
                    {songLyrics && (
                      <button
                        onClick={handleCopyLyrics}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '6px 14px',
                          color: copiedLyrics ? 'var(--accent-green)' : 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        title="Copy Lyrics"
                      >
                        {copiedLyrics ? <Check size={14} /> : <Copy size={14} />}
                        {copiedLyrics ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>

                  {songLyrics ? (
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      textAlign: 'center',
                      lineHeight: '2.0',
                      fontSize: '1.05rem',
                      color: '#e0e0e0',
                      fontFamily: 'inherit',
                      padding: '8px 0'
                    }}>
                      {songLyrics}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      padding: '24px 0'
                    }}>
                      No lyrics available for this song.
                    </div>
                  )}
                </div>

                {/* Delete Button Section */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', paddingBottom: '40px', padding: '0 24px' }}>
                  <button
                    onClick={handleDeleteSong}
                    style={{
                      backgroundColor: '#e91429',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      padding: '14px 40px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(233, 20, 41, 0.3)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      width: '100%',
                      maxWidth: '480px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff2a3a';
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(233, 20, 41, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#e91429';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(233, 20, 41, 0.3)';
                    }}
                  >
                    <Trash2 size={16} />
                    Delete Song
                  </button>
                </div>
              </div>
            )}

            {isEditModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(12, 12, 12, 0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
              }}>
                <div style={{
                  width: '100%',
                  maxWidth: '480px',
                  maxHeight: '90vh',
                  backgroundColor: '#181818',
                  borderRadius: '16px',
                  border: '1px solid rgba(29, 185, 84, 0.2)',
                  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {/* Modal Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                      Edit Song Details
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Close"
                    >
                      <X size={20} style={{ color: '#ffffff' }} />
                    </button>
                  </div>

                  {/* Modal Body / Form */}
                  <form onSubmit={handleSaveSongDetails} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    margin: 0
                  }}>
                    <div style={{
                      padding: '24px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      {/* Title (Required) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Song Title <span style={{ color: '#1db954' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={editFormData.title}
                          onChange={(e) => handleEditFormChange('title', e.target.value)}
                          required
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Primary Singer (Required) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Primary Singer <span style={{ color: '#1db954' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={editFormData.firstSinger}
                          onChange={(e) => handleEditFormChange('firstSinger', e.target.value)}
                          required
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Supporting Singer */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Supporting Singer
                        </label>
                        <input
                          type="text"
                          value={editFormData.secondSinger}
                          onChange={(e) => handleEditFormChange('secondSinger', e.target.value)}
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Movie Name */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Movie / Album
                        </label>
                        <input
                          type="text"
                          value={editFormData.movieName}
                          onChange={(e) => handleEditFormChange('movieName', e.target.value)}
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Featured Artists */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Featured Artists (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={editFormData.otherSinger}
                          onChange={(e) => handleEditFormChange('otherSinger', e.target.value)}
                          placeholder="e.g. Arijit Singh, Neha Kakkar"
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Composer */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Composer (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={editFormData.composer}
                          onChange={(e) => handleEditFormChange('composer', e.target.value)}
                          placeholder="e.g. Pritam, A.R. Rahman"
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Actor / Cast */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Actor / Cast (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={editFormData.actor}
                          onChange={(e) => handleEditFormChange('actor', e.target.value)}
                          placeholder="e.g. Ranbir Kapoor, Alia Bhatt"
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Music Label */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Music Label
                        </label>
                        <input
                          type="text"
                          value={editFormData.musicLabel}
                          onChange={(e) => handleEditFormChange('musicLabel', e.target.value)}
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Language */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Language
                        </label>
                        <input
                          type="text"
                          value={editFormData.language}
                          onChange={(e) => handleEditFormChange('language', e.target.value)}
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Country */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Country of Origin
                        </label>
                        <input
                          type="text"
                          value={editFormData.originCountry}
                          onChange={(e) => handleEditFormChange('originCountry', e.target.value)}
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>

                      {/* Source URL */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Source Video URL
                        </label>
                        <input
                          type="text"
                          value={editFormData.sourceUrl}
                          onChange={(e) => handleEditFormChange('sourceUrl', e.target.value)}
                          placeholder="e.g. https://www.youtube.com/watch?v=..."
                          style={{
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div style={{
                      padding: '16px 24px',
                      backgroundColor: '#121212',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex'
                    }}>
                      <button
                        type="submit"
                        disabled={editLoading}
                        style={{
                          backgroundColor: '#1db954',
                          color: '#000000',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          padding: '12px 24px',
                          borderRadius: '24px',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'center',
                          boxShadow: '0 4px 12px rgba(29, 185, 84, 0.2)',
                          opacity: editLoading ? 0.7 : 1,
                          transition: 'background-color 0.2s, transform 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!editLoading) {
                            e.currentTarget.style.backgroundColor = '#1ed760';
                            e.currentTarget.style.transform = 'scale(1.01)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1db954';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        {editLoading ? 'Updating Details...' : 'Update Details'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isDeleteConfirmOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(12, 12, 12, 0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px'
              }}>
                <div style={{
                  width: '100%',
                  maxWidth: '400px',
                  backgroundColor: '#181818',
                  borderRadius: '16px',
                  border: '1px solid rgba(233, 20, 41, 0.3)',
                  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  padding: '24px'
                }}>
                  {/* Warning Icon & Header */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                      backgroundColor: 'rgba(233, 20, 41, 0.1)',
                      borderRadius: '50%',
                      width: '64px',
                      height: '64px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#e91429'
                    }}>
                      <AlertCircle size={36} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                      Delete Song
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Warning: This action cannot be undone. Are you sure you want to permanently delete <strong style={{ color: '#ffffff' }}>"{detailedSong?.title}"</strong>?
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                      onClick={handleConfirmDeleteSong}
                      disabled={deleteLoading}
                      style={{
                        backgroundColor: '#e91429',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(233, 20, 41, 0.2)',
                        opacity: deleteLoading ? 0.7 : 1,
                        transition: 'background-color 0.2s, transform 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!deleteLoading) {
                          e.currentTarget.style.backgroundColor = '#ff2a3a';
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e91429';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      {deleteLoading ? 'Deleting Song...' : 'Delete Song'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      disabled={deleteLoading}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'center',
                        opacity: deleteLoading ? 0.5 : 0.8,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!deleteLoading) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.opacity = '0.8';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. PROFILE SETTINGS SCREEN (Includes Avatar, Details, and Uploaded Songs list) */}
        {activeSection === 'profile-settings' && (() => {
          return (
            <div className="profile-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'start', minHeight: '600px' }}>
              {/* Left side: Avatar & Profile Details */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-green) 0%, #282828 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  marginBottom: '28px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  border: '3px solid var(--border-color)',
                  userSelect: 'none'
                }}>
                  {(userProfile?.firstName || 'P').charAt(0).toUpperCase()}
                </div>

                {/* Profile details card */}
                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '32px',
                  width: '100%',
                  boxShadow: '0 4px 12px var(--shadow-color)'
                }}>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', fontWeight: 800, letterSpacing: '-0.5px', textAlign: 'center' }}>
                    Profile Details
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Email</span>
                      <span style={{ fontWeight: 600 }}>{userProfile?.email || 'graham@hotify.com'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>First Name</span>
                      <span style={{ fontWeight: 600 }}>{userProfile?.firstName || 'Graham'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Last Name</span>
                      <span style={{ fontWeight: 600 }}>{userProfile?.lastName || 'Nickbel'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Gender</span>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{userProfile?.gender || 'prefer-not-to-say'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Language</span>
                      <span style={{ fontWeight: 600 }}>{userProfile?.language || 'English'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>User Role</span>
                      <span style={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: userProfile?.userType === 'admin' ? 'var(--accent-green)' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {userProfile?.userType === 'admin' && <ShieldCheck size={16} />}
                        {userProfile?.userType || 'user'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="btn-primary"
                    style={{
                      backgroundColor: 'var(--accent-red)',
                      color: '#ffffff',
                      boxShadow: 'none',
                      marginTop: '32px',
                      width: '100%',
                      textAlign: 'center',
                      textTransform: 'none'
                    }}
                  >
                    Log Out Safely
                  </button>
                </div>
              </div>

              {/* Right side: Uploaded Songs Slide */}
              <div style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '32px',
                minHeight: '520px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 12px var(--shadow-color)',
                height: '100%',
                maxHeight: '620px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>My Uploaded Songs</h2>
                  <span style={{
                    fontSize: '0.8rem',
                    backgroundColor: 'rgba(29, 185, 84, 0.15)',
                    color: 'var(--accent-green)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontWeight: 700
                  }}>
                    {uploadedSongs.length} {uploadedSongs.length === 1 ? 'song' : 'songs'}
                  </span>
                </div>

                {loadingUploadedSongs ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    Loading uploaded songs...
                  </div>
                ) : uploadedSongs.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    padding: '40px 16px'
                  }}>
                    <Upload size={40} style={{ opacity: 0.4 }} />
                    <div>
                      <h4 style={{ color: 'var(--text-main)', margin: '0 0 6px 0' }}>No songs uploaded yet</h4>
                      <p style={{ fontSize: '0.8rem', margin: 0, lineHeight: '1.4' }}>Share your music with the community!</p>
                    </div>
                    <button
                      onClick={() => setActiveSection('song-upload')}
                      style={{
                        background: 'var(--accent-green)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        border: 'none',
                        padding: '8px 18px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      Upload a Song
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    overflowY: 'auto',
                    flex: 1,
                    paddingRight: '4px'
                  }}>
                    {uploadedSongs.map((song) => {
                      const isCurrent = currentSong?._id === song._id;
                      return (
                        <div
                          key={song._id}
                          onClick={() => playSong(song, uploadedSongs)}
                          onTouchStart={(e) => handleSwipeStart(e, song._id)}
                          onTouchMove={(e) => handleSwipeMove(e, song._id)}
                          onTouchEnd={(e) => handleSwipeEnd(e, song)}
                          className={`song-row ${isCurrent ? 'active' : ''} ${swipedSongId === song._id && swipeStartX !== null ? 'swiping' : ''}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: isCurrent ? 'var(--bg-card-hover)' : 'transparent',
                            '--swipe-offset': swipedSongId === song._id ? `${swipeOffset}px` : '0px',
                            '--swipe-opacity': swipedSongId === song._id && swipeOffset > 0 ? 1 : 0,
                            '--swipe-left-opacity': swipedSongId === song._id && swipeOffset < 0 ? 1 : 0
                          } as React.CSSProperties}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              background: song.coverUrl ? `url(${song.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1db954 0%, #191414 100%)'
                            }}>
                              {!song.coverUrl && <Music size={16} style={{ color: '#fff' }} />}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                              <span
                                style={{
                                  fontSize: '0.88rem',
                                  fontWeight: 600,
                                  color: isCurrent ? 'var(--accent-green)' : 'var(--text-main)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSongId(song._id);
                                  setActiveSection('song-detail');
                                }}
                                className="song-title-main"
                              >
                                {song.title}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {getArtistName(song)}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '12px' }}>
                            <span>{formatDuration(getDuration(song))}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 5. PLAYLIST CREATE SCREEN */}
        {activeSection === 'playlist-create' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            fontFamily: 'var(--font-family)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Backlit Radial Gold Glow */}
            <div style={{
              position: 'absolute',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(186, 141, 50, 0.08) 0%, rgba(18, 18, 18, 0) 70%)',
              zIndex: 1,
              pointerEvents: 'none',
              animation: 'glowBackdrop 5s ease-in-out infinite alternate'
            }} />

            {/* Main Arch Container */}
            <div style={{
              position: 'relative',
              width: '480px',
              height: '600px',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* SVG Golden Gate Arch (drawn from scratch) */}
              <svg viewBox="0 0 450 600" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1
              }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#bf953f" />
                    <stop offset="25%" stopColor="#fcf6ba" />
                    <stop offset="50%" stopColor="#b38728" />
                    <stop offset="75%" stopColor="#fbf5b7" />
                    <stop offset="100%" stopColor="#aa771c" />
                  </linearGradient>
                  <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* Outer Arch Frame */}
                <path
                  d="M 25 580 L 25 180 Q 25 150 60 140 Q 60 100 120 90 Q 120 50 225 15 Q 330 50 330 90 Q 390 100 390 140 Q 425 150 425 180 L 425 580 Z"
                  fill="none"
                  stroke="url(#goldGradient)"
                  strokeWidth="3.5"
                  style={{
                    strokeDasharray: 2000,
                    strokeDashoffset: 2000,
                    animation: 'drawGate 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards'
                  }}
                />
                
                {/* Inner Arch Frame */}
                <path
                  d="M 40 565 L 40 185 Q 40 158 72 148 Q 72 108 128 98 Q 128 62 225 30 Q 322 62 322 98 Q 378 108 378 148 Q 410 158 410 185 L 410 565"
                  fill="none"
                  stroke="url(#goldGradient)"
                  strokeWidth="1.5"
                  opacity="0.75"
                  style={{
                    strokeDasharray: 2000,
                    strokeDashoffset: 2000,
                    animation: 'drawGate 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                    animationDelay: '0.1s'
                  }}
                />
              </svg>

              {/* Inline CSS Animations */}
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes drawGate {
                  to {
                    stroke-dashoffset: 0;
                  }
                }
                @keyframes glowBackdrop {
                  0% { opacity: 0.6; }
                  100% { opacity: 1.0; }
                }
                @keyframes dropBounce {
                  0% {
                    opacity: 0;
                    transform: translateY(-60px);
                  }
                  60% {
                    opacity: 1;
                    transform: translateY(12px);
                  }
                  80% {
                    transform: translateY(-6px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                @keyframes slideUpBtn {
                  0% {
                    opacity: 0;
                    transform: translateY(50px) scale(0.95);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
                .gold-text-title {
                  background: linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  text-shadow: 0 0 10px rgba(186,141,50,0.3);
                  font-family: 'Cinzel', 'Playfair Display', 'Outfit', serif;
                  opacity: 0;
                  animation: dropBounce 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                  animation-delay: 0.8s;
                }
                .gold-input {
                  opacity: 0;
                  animation: dropBounce 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                  animation-delay: 0.9s;
                }
                .gold-input:focus {
                  border-color: #fcf6ba !important;
                  box-shadow: 0 4px 12px rgba(252, 246, 186, 0.15);
                }
                .gold-submit-btn {
                  opacity: 0;
                  animation: slideUpBtn 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                  animation-delay: 1.1s;
                }
                .gold-submit-btn:hover:not(:disabled) {
                  transform: scale(1.05) translateY(-2px) !important;
                  box-shadow: 0 8px 25px rgba(186, 141, 50, 0.5) !important;
                }
              `}} />

              {/* Form container inside the arch */}
              <form 
                onSubmit={handleCreatePlaylistSubmit}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80%',
                  height: '80%',
                  marginTop: '-40px',
                  textAlign: 'center'
                }}
              >
                {/* Title */}
                <h2 
                  className="gold-text-title"
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    margin: '0 auto 36px auto',
                    lineHeight: '1.4',
                    maxWidth: '280px',
                    wordBreak: 'break-word'
                  }}
                >
                  Name your child
                </h2>

                {/* Input */}
                <input
                  type="text"
                  placeholder="My Awesome Mix"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  autoFocus
                  className="gold-input"
                  style={{
                    border: 'none',
                    borderBottom: '2px solid #b38728',
                    background: 'transparent',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    padding: '8px',
                    width: '85%',
                    maxWidth: '260px',
                    outline: 'none',
                    textAlign: 'center',
                    marginBottom: '44px',
                    transition: 'all 0.3s ease'
                  }}
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={playlistLoading || !playlistName.trim()}
                  className="gold-submit-btn"
                  style={{
                    background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #aa771c)',
                    color: '#121212',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(186, 141, 50, 0.3)',
                    transition: 'all 0.3s ease',
                    opacity: playlistLoading || !playlistName.trim() ? 0.6 : 1
                  }}
                >
                  {playlistLoading ? 'Creating...' : 'Create'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 6. SONG UPLOAD SCREEN (Split Layout: 70% left metadata form inside 1000px Golden Gate Arch, 30% right media upload) */}
        {activeSection === 'song-upload' && (
          <div className="song-upload-container" style={{
            display: 'flex',
            gap: '40px',
            width: '100%',
            alignItems: 'flex-start',
            padding: '24px 0',
            fontFamily: 'var(--font-family)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Backlit Radial Gold Glow */}
            <div style={{
              position: 'absolute',
              width: '1000px',
              height: '1000px',
              background: 'radial-gradient(circle, rgba(186, 141, 50, 0.06) 0%, rgba(18, 18, 18, 0) 70%)',
              zIndex: 1,
              pointerEvents: 'none',
              left: '5%',
              top: '5%',
              animation: 'glowBackdrop 5s ease-in-out infinite alternate'
            }} />

            {/* Inline CSS Animations & Styles */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes drawGateUpload {
                to {
                  stroke-dashoffset: 0;
                }
              }
              .gold-field-input:focus {
                border-color: #fcf6ba !important;
                box-shadow: 0 4px 12px rgba(252, 246, 186, 0.15);
              }
              .gold-dropzone:hover {
                border-color: #fcf6ba !important;
                background-color: rgba(186, 141, 50, 0.08) !important;
              }
            `}} />

            {/* Left Column (70%): Metadata form inside 1000px Golden Gate SVG Arch */}
            <div className="song-upload-left" style={{
              width: '68%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1000px',
                height: '1350px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {/* Desktop SVG Golden Gate Arch */}
                <svg className="hide-on-mobile" viewBox="0 0 750 1300" preserveAspectRatio="xMidYMin meet" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}>
                  <defs>
                    <linearGradient id="goldGradientUploadDesktop" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#bf953f" />
                      <stop offset="25%" stopColor="#fcf6ba" />
                      <stop offset="50%" stopColor="#b38728" />
                      <stop offset="75%" stopColor="#fbf5b7" />
                      <stop offset="100%" stopColor="#aa771c" />
                    </linearGradient>
                  </defs>
                  
                  {/* Outer Arch Frame */}
                  <path
                    d="M 25 1280 L 25 180 Q 25 150 65 140 Q 65 100 155 90 Q 155 50 375 15 Q 595 50 595 90 Q 685 100 685 140 Q 725 150 725 180 L 725 1280 Z"
                    fill="none"
                    stroke="url(#goldGradientUploadDesktop)"
                    strokeWidth="3.5"
                    style={{
                      strokeDasharray: 4800,
                      strokeDashoffset: 4800,
                      animation: 'drawGateUpload 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards'
                    }}
                  />
                  
                  {/* Inner Arch Frame */}
                  <path
                    d="M 40 1265 L 40 185 Q 40 158 77 148 Q 77 108 163 98 Q 163 62 375 30 Q 587 62 587 98 Q 673 108 673 148 Q 710 158 710 185 L 710 1265"
                    fill="none"
                    stroke="url(#goldGradientUploadDesktop)"
                    strokeWidth="1.5"
                    opacity="0.75"
                    style={{
                      strokeDasharray: 4800,
                      strokeDashoffset: 4800,
                      animation: 'drawGateUpload 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                      animationDelay: '0.1s'
                    }}
                  />
                </svg>

                {/* Mobile SVG Golden Gate Arch (stretched) */}
                <svg className="show-on-mobile" viewBox="0 0 750 1300" preserveAspectRatio="none" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}>
                  <defs>
                    <linearGradient id="goldGradientUploadMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#bf953f" />
                      <stop offset="25%" stopColor="#fcf6ba" />
                      <stop offset="50%" stopColor="#b38728" />
                      <stop offset="75%" stopColor="#fbf5b7" />
                      <stop offset="100%" stopColor="#aa771c" />
                    </linearGradient>
                  </defs>
                  
                  {/* Outer Arch Frame */}
                  <path
                    d="M 25 1280 L 25 180 Q 25 150 65 140 Q 65 100 155 90 Q 155 50 375 15 Q 595 50 595 90 Q 685 100 685 140 Q 725 150 725 180 L 725 1280 Z"
                    fill="none"
                    stroke="url(#goldGradientUploadMobile)"
                    strokeWidth="3.5"
                    style={{
                      strokeDasharray: 4800,
                      strokeDashoffset: 4800,
                      animation: 'drawGateUpload 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards'
                    }}
                  />
                  
                  {/* Inner Arch Frame */}
                  <path
                    d="M 40 1265 L 40 185 Q 40 158 77 148 Q 77 108 163 98 Q 163 62 375 30 Q 587 62 587 98 Q 673 108 673 148 Q 710 158 710 185 L 710 1265"
                    fill="none"
                    stroke="url(#goldGradientUploadMobile)"
                    strokeWidth="1.5"
                    opacity="0.75"
                    style={{
                      strokeDasharray: 4800,
                      strokeDashoffset: 4800,
                      animation: 'drawGateUpload 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                      animationDelay: '0.1s'
                    }}
                  />
                </svg>

                {/* Form inside the arch */}
                <form 
                  id="song-upload-form"
                  onSubmit={handleSongUploadSubmit}
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '92%',
                    marginTop: '190px',
                    paddingBottom: '60px',
                    textAlign: 'left'
                  }}
                >
                  <h2 
                    className="gold-text-title"
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      margin: '0 auto 32px auto',
                      alignSelf: 'center',
                      lineHeight: '1.4',
                      maxWidth: '280px',
                      wordBreak: 'break-word',
                      textAlign: 'center'
                    }}
                  >
                    Song Info
                  </h2>

                  {/* 11 Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%', alignItems: 'center' }}>
                    {/* Song Title (Required) */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Song Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Naina"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        required
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Primary Singer (Required) */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Primary Singer *</label>
                      <input
                        type="text"
                        placeholder="e.g. Arijit Sing"
                        value={songFirstSinger}
                        onChange={(e) => setSongFirstSinger(e.target.value)}
                        required
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Supporting Singer */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Supporting (Second) Singer</label>
                      <input
                        type="text"
                        placeholder="e.g. Amitabh Bhattacharya"
                        value={songSecondSinger}
                        onChange={(e) => setSongSecondSinger(e.target.value)}
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Other Singers */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Other Singers (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Singer A, Singer B"
                        value={songOtherSinger}
                        onChange={(e) => setSongOtherSinger(e.target.value)}
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Composer */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Composer(s) (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Pritam, AR Rahman"
                        value={songComposer}
                        onChange={(e) => setSongComposer(e.target.value)}
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Movie Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Movie / Album Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dangal"
                        value={songMovieName}
                        onChange={(e) => setSongMovieName(e.target.value)}
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Actors */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Cast / Actors (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Aamir Khan, Sakshi Tanwar"
                        value={songActor}
                        onChange={(e) => setSongActor(e.target.value)}
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Music Label */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Music Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Zee Music Company"
                        value={songMusicLabel}
                        onChange={(e) => setSongMusicLabel(e.target.value)}
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Source URL */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Source / YouTube Link</label>
                      <input
                        type="text"
                        placeholder="e.g. https://www.youtube.com/watch?v=..."
                        value={songSourceUrl}
                        onChange={(e) => setSongSourceUrl(e.target.value)}
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Language */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Language</label>
                      <input
                        type="text"
                        placeholder="e.g. Hindi"
                        value={songLanguage}
                        onChange={(e) => setSongLanguage(e.target.value)}
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Origin Country */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '88%', alignItems: 'flex-start', gap: '6px', marginBottom: '24px' }} className="gold-input">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#bf953f', letterSpacing: '1px', paddingLeft: '4px' }}>Origin Country</label>
                      <input
                        type="text"
                        placeholder="e.g. India"
                        value={songOriginCountry}
                        onChange={(e) => setSongOriginCountry(e.target.value)}
                        className="gold-field-input"
                        style={{
                          border: 'none',
                          borderBottom: '2px solid #b38728',
                          background: 'transparent',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          padding: '10px 4px',
                          width: '100%',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column (30%): Media Upload dropzone (sticky) */}
            <div className="song-upload-right" style={{
              width: '30%',
              position: 'sticky',
              top: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              zIndex: 3
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#bf953f',
                margin: '0 0 8px 0',
                fontFamily: 'Cinzel, serif'
              }}>
                Audio File
              </h3>

              <div style={{
                border: '2px dashed #b38728',
                borderRadius: '12px',
                padding: '40px 24px',
                textAlign: 'center',
                cursor: uploadLoading ? 'not-allowed' : 'pointer',
                backgroundColor: songFile ? 'rgba(186, 141, 50, 0.08)' : 'rgba(186, 141, 50, 0.02)',
                boxShadow: songFile ? '0 8px 24px rgba(186, 141, 50, 0.15)' : 'none',
                transition: 'all 0.3s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                minHeight: '260px'
              }}
              className="gold-dropzone"
              >
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleSongFileChange} 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: uploadLoading ? 'not-allowed' : 'pointer'
                  }}
                  disabled={uploadLoading}
                />
                {songFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <FileAudio size={48} style={{ color: '#fcf6ba', filter: 'drop-shadow(0 0 8px rgba(252,246,186,0.4))' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', wordBreak: 'break-all', padding: '0 8px' }}>
                      {songFile.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#bf953f', fontWeight: 700 }}>
                      {(songFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSongFile(null);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--accent-red)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        marginTop: '8px',
                        zIndex: 5
                      }}
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Upload size={48} style={{ color: '#b38728' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                      Select Audio File
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '200px', lineHeight: '1.4' }}>
                      Drag & drop or browse your local files
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      MP3, WAV, FLAC, AAC supported
                    </span>
                  </div>
                )}
              </div>

              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#bf953f',
                margin: '16px 0 8px 0',
                fontFamily: 'Cinzel, serif'
              }}>
                Lyrics (Optional)
              </h3>

              <textarea
                value={songLyricsText}
                onChange={(e) => setSongLyricsText(e.target.value)}
                placeholder="Paste song lyrics here..."
                disabled={uploadLoading}
                style={{
                  width: '100%',
                  minHeight: '260px',
                  backgroundColor: 'rgba(186, 141, 50, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '24px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  boxShadow: songLyricsText ? '0 8px 24px rgba(186, 141, 50, 0.15)' : 'none',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => e.target.style.border = '1px solid #bf953f'}
                onBlur={(e) => e.target.style.border = '1px solid var(--border-color)'}
              />

              {uploadError && (
                <div style={{
                  backgroundColor: 'rgba(233, 20, 41, 0.12)',
                  border: '1px solid var(--accent-red)',
                  color: 'var(--accent-red)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Submit button placed in the right column */}
              <button
                type="submit"
                form="song-upload-form"
                disabled={uploadLoading}
                className="gold-submit-btn"
                style={{
                  background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #aa771c)',
                  color: '#121212',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  border: 'none',
                  padding: '14px 56px',
                  borderRadius: '28px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(186, 141, 50, 0.3)',
                  transition: 'all 0.3s ease',
                  opacity: uploadLoading ? 0.6 : 1,
                  marginTop: '24px',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                {uploadLoading ? 'Uploading...' : 'Upload Song'}
              </button>
            </div>
          </div>
        )}

        {/* Custom Playlist Rename Modal */}
        {isPlaylistRenameOpen && (
          <div className="modal-overlay" onClick={() => setIsPlaylistRenameOpen(false)}>
            <div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()} 
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '28px',
                border: '1px solid var(--border-color)',
                width: '400px',
                boxShadow: '0 8px 32px var(--shadow-color)',
                color: 'var(--text-main)',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => setIsPlaylistRenameOpen(false)} 
                className="icon-btn" 
                style={{ position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px' }}
              >
                <X size={16} />
              </button>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>
                Rename Playlist
              </h3>

              <form onSubmit={handlePlaylistRenameSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    value={playlistRenameValue}
                    onChange={(e) => setPlaylistRenameValue(e.target.value)}
                    placeholder="Enter new name"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '0.9rem',
                      color: 'var(--text-main)',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPlaylistRenameOpen(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: 'var(--accent-green)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Playlist Delete Confirmation Modal */}
        {isPlaylistDeleteOpen && (
          <div className="modal-overlay" onClick={() => setIsPlaylistDeleteOpen(false)}>
            <div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()} 
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '28px',
                border: '1px solid var(--border-color)',
                width: '400px',
                boxShadow: '0 8px 32px var(--shadow-color)',
                color: 'var(--text-main)',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => setIsPlaylistDeleteOpen(false)} 
                className="icon-btn" 
                style={{ position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px' }}
              >
                <X size={16} />
              </button>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: 'var(--accent-red)', letterSpacing: '-0.5px' }}>
                Delete Playlist
              </h3>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
                Are you sure you want to delete <strong>"{selectedPlaylist?.name}"</strong>? This will permanently delete the playlist. Any songs inside it will remain in your library.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsPlaylistDeleteOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaylistDeleteSubmit}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor: 'var(--accent-red)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Swipe Add to Playlist Modal */}
        {swipeActionSong && (
          <div className="modal-overlay" onClick={() => setSwipeActionSong(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSwipeActionSong(null)}>
                <X size={24} />
              </button>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px' }}>
                Add to Playlist
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
                {playlists.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No playlists available.</p>
                ) : (
                  playlists.map(p => (
                    <button
                      key={p._id}
                      onClick={() => {
                        handleAddSongToPlaylist(p._id, swipeActionSong._id);
                        setSwipeActionSong(null);
                      }}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-main)',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-input)'; }}
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom Toast Notification */}
        {toastMessage && (
          <div className={`toast-notification ${toastType === 'error' ? 'error' : 'success'}`}>
            {toastType === 'error' ? (
              <AlertCircle size={18} style={{ color: 'var(--accent-red)' }} />
            ) : (
              <Check size={18} style={{ color: 'var(--accent-green)' }} />
            )}
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
};
