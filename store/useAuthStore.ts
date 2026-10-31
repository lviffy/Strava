import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiClient } from '../services/ApiClient';
import { AuthService, AthleteUser } from '../services/AuthService';

const TOKEN_KEY = 'strava_auth_token';
const USER_KEY = 'strava_auth_user';

interface AuthState {
  token: string | null;
  user: AthleteUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    city?: string;
    bio?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: AthleteUser | null) => void;
  clearError: () => void;
}

// Storage helpers with web compatibility
async function saveSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (e) {
    console.warn(`Failed to save secure item ${key}:`, e);
  }
}

async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (e) {
    console.warn(`Failed to get secure item ${key}:`, e);
    return null;
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (e) {
    console.warn(`Failed to delete secure item ${key}:`, e);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initializeAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const savedToken = await getSecureItem(TOKEN_KEY);
      const savedUserStr = await getSecureItem(USER_KEY);

      if (savedToken) {
        ApiClient.setToken(savedToken);
        let user: AthleteUser | null = null;
        if (savedUserStr) {
          try {
            user = JSON.parse(savedUserStr);
          } catch {}
        }

        set({
          token: savedToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Background refresh profile from server
        try {
          const freshUser = await AuthService.getCurrentUser();
          set({ user: freshUser });
          await saveSecureItem(USER_KEY, JSON.stringify(freshUser));
        } catch {
          // Keep saved user cache if network offline
        }
      } else {
        ApiClient.setToken(null);
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: err.message || 'Failed to initialize session',
      });
    }
  },

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const res = await AuthService.login(email, password);
      ApiClient.setToken(res.token);

      await saveSecureItem(TOKEN_KEY, res.token);
      await saveSecureItem(USER_KEY, JSON.stringify(res.user));

      set({
        token: res.token,
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed. Please check your credentials.',
      });
      return false;
    }
  },

  register: async (data): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const res = await AuthService.register(data);
      ApiClient.setToken(res.token);

      await saveSecureItem(TOKEN_KEY, res.token);
      await saveSecureItem(USER_KEY, JSON.stringify(res.user));

      set({
        token: res.token,
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Registration failed. Please check your inputs.',
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      ApiClient.setToken(null);
      await deleteSecureItem(TOKEN_KEY);
      await deleteSecureItem(USER_KEY);
    } finally {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));
