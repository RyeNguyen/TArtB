import { create } from "zustand";
import { User } from "firebase/auth";
import { authService } from "@services/firebase/authService";
import { useTodoStore } from "./todoStore";

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
      if (isFirstLoad && isAuthenticated) {
        // Initial load with authenticated user: Just load from cloud, don't merge/upload
        await useTodoStore.getState().onAuthStateChange(isAuthenticated, true);
      } else if (wasAuthenticated !== isAuthenticated) {
        // Actual auth state change: Do full merge and upload
        await useTodoStore.getState().onAuthStateChange(isAuthenticated, false);
      }

      previousUser = user;
      isFirstLoad = false;
    });

    return unsubscribe;
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      await authService.signInWithGoogle();
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });

    try {
      await authService.signOut();
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign out failed";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
