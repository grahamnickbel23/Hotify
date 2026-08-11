// Centralized API Client for Hotify frontend

const DEFAULT_AUTH_URL = 'http://100.123.126.113:8002';
const DEFAULT_MAIN_URL = 'http://100.123.126.113:8001';

export interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'male' | 'female' | 'prefer-not-to-say';
  dob?: string;
  language?: string;
  preference?: 'bright' | 'dark';
  userType?: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface Song {
  _id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number; // in seconds
  fileName?: string;
  coverUrl?: string; // custom cover image
  url?: string; // manifest path
  firstSinger?: string;
  otherSinger?: string[];
  composer?: string[];
  actor?: string[];
  singer?: string;
  otherContribution?: string;
  secondSinger?: string;
  musicLabel?: string;
  length?: number;
  language?: string;
  originCountry?: string;
  uploadedBy?: string;
  albumName?: string;
  movieName?: string;
  audioLength?: number;
  sourceUrl?: string;
  uploadedAudioFormat?: string;
  createdAt?: string;
}

export interface Playlist {
  _id: string;
  name: string;
  songs: Song[] | string[]; // Can be full objects or just IDs depending on populate
  createdAt?: string;
}

export interface LyricsInfo {
  _id: string;
  songId: string;
  lyrics: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface ExtendedRequestInit extends RequestInit {
  _retry?: boolean;
}

class ApiClient {
  private authUrl: string;
  private mainUrl: string;

  constructor() {
    this.authUrl = localStorage.getItem('hotify_auth_url') || DEFAULT_AUTH_URL;
    this.mainUrl = localStorage.getItem('hotify_main_url') || DEFAULT_MAIN_URL;
  }

  // Getters & Setters for dynamic configurations
  getAuthUrl() { return this.authUrl; }
  setAuthUrl(url: string) {
    this.authUrl = url;
    localStorage.setItem('hotify_auth_url', url);
  }

  getMainUrl() { return this.mainUrl; }
  setMainUrl(url: string) {
    this.mainUrl = url;
    localStorage.setItem('hotify_main_url', url);
  }

  getAccessToken() { return localStorage.getItem('hotify_access_token'); }
  setAccessToken(token: string) { localStorage.setItem('hotify_access_token', token); }

  getRefreshToken() { return localStorage.getItem('hotify_refresh_token'); }
  setRefreshToken(token: string) { localStorage.setItem('hotify_refresh_token', token); }

  clearTokens() {
    localStorage.removeItem('hotify_access_token');
    localStorage.removeItem('hotify_refresh_token');
  }

  // Generic request wrapper that handles Authorization headers and token refresh on 401
  private async request(url: string, options: ExtendedRequestInit = {}, _isAuthServer = false): Promise<any> {
    const accessToken = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const fullUrl = url;
    const response = await fetch(fullUrl, { credentials: 'include', ...options, headers });

    // Handle 401 Unauthorized (Expired access token)
    if (response.status === 401 && !options._retry && !url.includes('/auth/request/login') && !url.includes('/auth/confirm/login') && !url.includes('/auth/signup')) {
      options._retry = true;
      try {
        const refreshed = await this.refreshToken();
        if (refreshed && refreshed.accessToken) {
          this.setAccessToken(refreshed.accessToken);
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${refreshed.accessToken}`;
          const retryResponse = await fetch(fullUrl, { credentials: 'include', ...options, headers });
          return await this.handleResponse(retryResponse);
        }
      } catch (err) {
        this.clearTokens();
        throw new Error('Session expired. Please log in again.');
      }
    }

    return await this.handleResponse(response);
  }

  private async handleResponse(response: Response): Promise<any> {
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! Status: ${response.status}`);
    }
    return data;
  }

  // Auth Microservice API Calls
  async requestLogin(email: string, password: string): Promise<{ message: string }> {
    return this.request('/auth/request/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, true);
  }

  async confirmLogin(otp: string, deviceType: string, ipAddress: string, loginLocation: string): Promise<{ accessToken: string; refreshToken: string; user: UserProfile }> {
    const data = await this.request('/auth/confirm/login', {
      method: 'POST',
      body: JSON.stringify({ otp, deviceType, ipAddress, loginLocation }),
    }, true);

    if (data.accessToken) this.setAccessToken(data.accessToken);
    if (data.refreshToken) this.setRefreshToken(data.refreshToken);
    return data;
  }

  async signup(userForm: Partial<UserProfile> & { password?: string }, isAdminCreation = false): Promise<{ message: string }> {
    const headers: Record<string, string> = {};
    if (isAdminCreation) {
      headers['admin'] = 'test@user.com'; // Admin creation requires header flag as per api spec
    }
    return this.request('/auth/signup', {
      method: 'POST',
      headers,
      body: JSON.stringify(userForm),
    }, true);
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const refresh = this.getRefreshToken();
    if (!refresh) throw new Error('No refresh token available');

    // POST /auth/token retrieves a new access token
    const res = await fetch(`/auth/token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refresh}`,
      },
    });

    if (!res.ok) {
      this.clearTokens();
      throw new Error('Refresh token expired');
    }

    const data = await res.json();
    if (data.accessToken) {
      this.setAccessToken(data.accessToken);
    }
    return data;
  }

  async getProfile(): Promise<{ user: UserProfile }> {
    return this.request('/auth/profile', { method: 'POST' }, true);
  }

  async logout(email: string, password: string): Promise<{ message: string }> {
    const res = await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, true);
    this.clearTokens();
    return res;
  }

  // Song Microservice API Calls
  async getAllSongs(): Promise<{ songs: Song[] }> {
    return this.request('/song/all');
  }

  async getSongDetails(songId: string): Promise<{ success: boolean; message: string; songInfo: Song; song: Song; lyricsInfo?: LyricsInfo }> {
    const data = await this.request('/song/read', {
      method: 'POST',
      body: JSON.stringify({ songId }),
    });
    return {
      ...data,
      song: data.songInfo || data.song,
    };
  }

  async uploadSong(formData: FormData): Promise<{ message: string; song: Song }> {
    // For multipart uploads, don't set JSON Content-Type, let the browser define it
    const accessToken = this.getAccessToken();
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`/song/upload`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });
    return this.handleResponse(res);
  }

  async deleteSong(songId: string): Promise<{ message: string }> {
    return this.request('/song/delete', {
      method: 'POST',
      body: JSON.stringify({ songId }),
    });
  }

  async updateSong(songId: string, fieldName: string, info: string): Promise<{ success: boolean; message: string; song: Song }> {
    return this.request('/song/update', {
      method: 'POST',
      body: JSON.stringify({ songId, fieldName, info }),
    });
  }

  // Search API Call
  async searchSongs(query: string): Promise<{ success: boolean; message: string; result: Song[]; songs?: Song[] }> {
    return this.request(`/search/${encodeURIComponent(query)}`, {
      method: 'GET',
    });
  }

  async recordSearchHistory(searchItem: string, songId: string): Promise<{ success: boolean; message?: string }> {
    return this.request('/search/history', {
      method: 'POST',
      body: JSON.stringify({ searchItem, songId }),
    });
  }

  async getSearchHistory(): Promise<{ success: boolean; result?: any[]; history?: any[] }> {
    return this.request('/search/read/history', {
      method: 'GET',
    });
  }

  // Playlist API Calls
  async getAllPlaylists(): Promise<{ playlists: Playlist[] }> {
    const res = await this.request('/playlist/read', { method: 'GET' });
    // Normalize return value in case format varies
    return res;
  }

  async getPlaylistDetails(playlistId: string): Promise<{ success: boolean; message: string; playlist: Playlist }> {
    return this.request(`/playlist/${encodeURIComponent(playlistId)}/read`, {
      method: 'GET',
    });
  }

  async createPlaylist(name: string): Promise<{ message: string; playlist: Playlist }> {
    return this.request('/playlist/create', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deletePlaylist(playlistId: string): Promise<{ message: string }> {
    return this.request('/playlist/delete', {
      method: 'POST',
      body: JSON.stringify({ playlistId }),
    });
  }

  async renamePlaylist(playlistId: string, name: string): Promise<{ message: string; playlist: Playlist }> {
    return this.request('/playlist/rename', {
      method: 'POST',
      body: JSON.stringify({ playlistId, name }),
    });
  }

  async addSongToPlaylist(playlistId: string, songId: string): Promise<{ message: string }> {
    return this.request('/playlist/add/song', {
      method: 'POST',
      body: JSON.stringify({ playlistId, songId }),
    });
  }

  async deleteSongFromPlaylist(playlistId: string, songId: string): Promise<{ message: string }> {
    return this.request('/playlist/delete/song', {
      method: 'POST',
      body: JSON.stringify({ playlistId, songId }),
    });
  }

  // Autoplay next song API
  async getAutoplayNext(playlistId: string, songId: string): Promise<{ nextSongId: string }> {
    return this.request(`/streaming/autoplay?playlistId=${playlistId}&songId=${songId}`, {
      method: 'GET',
    });
  }

  // Get stream history API
  async getStreamHistory(page: number, length: number): Promise<{ success: boolean; message: string; result: any[] }> {
    return this.request('/streaming/history', {
      method: 'POST',
      body: JSON.stringify({ page, length }),
    });
  }

  // Get uploaded songs API
  async getUploadedSongs(): Promise<{ success: boolean; songs?: Song[]; data?: Song[]; result?: Song[]; info?: Song[] }> {
    return this.request('/song/all/admin', {
      method: 'GET',
    });
  }

  // Get lyrics API
  async getSongLyrics(songId: string): Promise<{ suucess: boolean; message: string; lyricsInfo: LyricsInfo }> {
    return this.request('/song/lyrics', {
      method: 'POST',
      body: JSON.stringify({ songId }),
    });
  }

  // Helper stream URLs
  getManifestUrl(songId: string): string {
    return `/streaming/${songId}/manifest.mpd`;
  }
}

export const api = new ApiClient();
