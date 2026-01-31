import { create } from 'zustand';
import { User } from 'firebase/auth';
import { authService } from '@services/firebase/authService';
import { useTodoStore } from './todoStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  // State
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Initialize auth listener (call once on app start)
  initialize: () => {
    set({ isLoading: true });
    let previousUser: User | null = null;
    let isFirstLoad = true;

    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      const wasAuthenticated = !!previousUser;
      const isAuthenticated = !!user;

      set({
        user,
        isLoading: false,
        isInitialized: true,
      });

      // Handle auth state changes for todo sync
      // Skip if first load and not authenticated (no need to reload local data)
      if (!isFirstLoad || isAuthenticated) {
        // Only trigger if auth state actually changed
        if (wasAuthenticated !== isAuthenticated) {
          await useTodoStore.getState().onAuthStateChange(isAuthenticated);
        }
      }

      previousUser = user;
      isFirstLoad = false;
    });

    return unsubscribe;
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      await authService.signInWithGoogle();
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    set({ isLoading: true, error: null });

    try {
      await authService.signOut();
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
