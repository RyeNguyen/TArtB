import { create } from 'zustand';
import { Artwork } from '../types/artwork';

interface ArtworkStore {
  currentArtwork: Artwork | null;
  setCurrentArtwork: (artwork: Artwork | null) => void;
  lastFetchTime: number;
  updateLastFetchTime: (time: number) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useArtworkStore = create<ArtworkStore>((set) => ({
  currentArtwork: null,
  setCurrentArtwork: (artwork) => set({ currentArtwork: artwork }),
  lastFetchTime: 0,
  updateLastFetchTime: (time) => set({ lastFetchTime: time }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));
