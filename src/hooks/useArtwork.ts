import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSettingsStore } from '../stores/settingsStore';
import { useArtworkStore } from '../stores/artworkStore';
import { fetchRandomArtworkFromFirestore } from '../services/firebase/firestoreService';
import { fetchRandomArtwork as fetchFromArtic } from '../services/api/artInstituteApi';
import { fetchRandomArtwork as fetchFromMet } from '../services/api/metMuseumApi';
import { fetchRandomArtwork as fetchFromWikiArt } from '../services/api/wikiArtApi';
import { Artwork } from '../types/artwork';

export const useArtwork = () => {
  const { settings } = useSettingsStore();
  const {
    currentArtwork,
    setCurrentArtwork,
    lastFetchTime,
    updateLastFetchTime,
    setIsLoading,
    setError,
  } = useArtworkStore();

  const shouldRefetch = () => {
    if (!currentArtwork || lastFetchTime === 0) {
      return true;
    }

    const now = Date.now();
    const interval = settings.artwork.changeInterval * 60 * 1000; // Convert minutes to milliseconds
    return now - lastFetchTime >= interval;
  };

  const fetchArtwork = async (): Promise<Artwork> => {
    let museum = settings.artwork.museum;

    console.log(`Fetching artwork (museum: ${museum})...`);

    try {
      console.log('Attempting to fetch from Firestore...');
      const artwork = await fetchRandomArtworkFromFirestore(museum);

      setCurrentArtwork(artwork);
      updateLastFetchTime(Date.now());

      return artwork;
    } catch (firestoreError) {
      console.warn('Firestore fetch failed, falling back to direct API calls:', firestoreError);

      // FALLBACK: If Firestore fails, use direct API calls
      // This ensures the extension still works even if Firebase is down

      // If random, pick one randomly from all three
      if (museum === 'random') {
        const museums: ('artic' | 'met' | 'wikiart')[] = ['artic', 'met', 'wikiart'];
        museum = museums[Math.floor(Math.random() * museums.length)];
      }

      try {
        // Fetch from the selected museum API
        let artwork: Artwork;
        if (museum === 'artic') {
          artwork = await fetchFromArtic();
        } else if (museum === 'met') {
          artwork = await fetchFromMet();
        } else {
          artwork = await fetchFromWikiArt();
        }

        // Update the artwork store
        setCurrentArtwork(artwork);
        updateLastFetchTime(Date.now());

        return artwork;
      } catch (apiError) {
        console.error(`API fetch also failed for ${museum}:`, apiError);

        // Try other museums as last resort
        if (museum !== 'met') {
          try {
            console.log('Last resort: trying Met Museum...');
            const artwork = await fetchFromMet();
            setCurrentArtwork(artwork);
            updateLastFetchTime(Date.now());
            return artwork;
          } catch (metError) {
            console.error('Met Museum fallback failed:', metError);
          }
        }

        // If everything fails, throw error
        throw new Error('Failed to fetch artwork from all sources');
      }
    }
  };

  const query = useQuery({
    queryKey: ['artwork', settings.artwork.museum, settings.artwork.changeInterval],
    queryFn: fetchArtwork,
    enabled: shouldRefetch(),
    staleTime: settings.artwork.changeInterval * 60 * 1000,
    gcTime: settings.artwork.changeInterval * 60 * 1000 * 2, // Keep in cache for 2x the interval
    refetchInterval: settings.artwork.changeInterval * 60 * 1000, // Auto-refetch based on interval
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    placeholderData: keepPreviousData, // Keep showing previous artwork while fetching new one
  });

  if (query.isLoading !== useArtworkStore.getState().isLoading) {
    setIsLoading(query.isLoading);
  }

  if (query.error) {
    setError(query.error instanceof Error ? query.error.message : 'Failed to fetch artwork');
  } else if (useArtworkStore.getState().error !== null) {
    setError(null);
  }

  return {
    artwork: currentArtwork,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
