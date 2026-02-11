import axios from 'axios';
import { Artwork } from '../../types/artwork';

const BASE_URL = 'https://www.wikiart.org';
const ACCESS_CODE = import.meta.env.VITE_WIKIART_ACCESS_CODE;
const SECRET_CODE = import.meta.env.VITE_WIKIART_SECRET_CODE;

// Configure axios instance with timeout and CORS settings
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

interface WikiArtSession {
  SessionKey: string;
}

interface WikiArtPainting {
  id: string;
  title: string;
  artistName: string;
  completitionYear: number;
  image: string;
  width: number;
  height: number;
  contentId: number;
}

interface WikiArtPaintingsResponse {
  data: WikiArtPainting[];
  paginationToken: string;
  hasMore: boolean;
}

// Session key cache (stored in memory, expires when extension reloads)
let sessionKey: string | null = null;

// Storage key for persisting session
const STORAGE_KEY = 'wikiart_session';
const SESSION_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

interface StoredSession {
  key: string;
  expiresAt: number;
}

// Get Chrome storage (with fallback to localStorage)
const getChromeStorage = () => {
  if (typeof window !== 'undefined' &&
      typeof (window as any).chrome !== 'undefined' &&
      (window as any).chrome?.storage?.local) {
    return (window as any).chrome.storage.local;
  }
  return null;
};

// Get stored session from Chrome storage
const getStoredSession = async (): Promise<StoredSession | null> => {
  const storage = getChromeStorage();

  if (storage) {
    return new Promise((resolve) => {
      storage.get(STORAGE_KEY, (result: any) => {
        const stored = result[STORAGE_KEY];
        if (stored && stored.key && stored.expiresAt > Date.now()) {
          console.log('✅ Found valid stored session');
          resolve(stored);
        } else {
          resolve(null);
        }
      });
    });
  } else {
    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: StoredSession = JSON.parse(stored);
      if (parsed.expiresAt > Date.now()) {
        console.log('✅ Found valid stored session (localStorage)');
        return parsed;
      }
    }
  }

  return null;
};

// Store session in Chrome storage
const storeSession = async (key: string): Promise<void> => {
  const storage = getChromeStorage();
  const session: StoredSession = {
    key,
    expiresAt: Date.now() + SESSION_EXPIRY,
  };

  if (storage) {
    return new Promise((resolve) => {
      storage.set({ [STORAGE_KEY]: session }, () => {
        console.log('💾 Session stored in Chrome storage');
        resolve();
      });
    });
  } else {
    // Fallback to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    console.log('💾 Session stored in localStorage');
  }
};

// Create or retrieve session
const getSessionKey = async (): Promise<string> => {
  // Check memory cache first
  if (sessionKey) {
    console.log('Using cached session from memory');
    return sessionKey;
  }

  // Check persistent storage
  const stored = await getStoredSession();
  if (stored) {
    sessionKey = stored.key;
    console.log('Using stored session:', sessionKey.substring(0, 10) + '...');
    return sessionKey;
  }

  // Create new session
  try {
    console.log('🔐 Creating NEW WikiArt session...');
    console.log('Access Code:', ACCESS_CODE ? 'Present' : 'Missing');
    console.log('Secret Code:', SECRET_CODE ? 'Present' : 'Missing');

    const url = `/en/Api/2/login?accessCode=${ACCESS_CODE}&secretCode=${SECRET_CODE}`;
    console.log('Login URL:', BASE_URL + url);

    const { data } = await api.get<WikiArtSession>(url);

    if (!data.SessionKey) {
      console.error('❌ No SessionKey in response:', data);
      throw new Error('Failed to create WikiArt session');
    }

    sessionKey = data.SessionKey;
    console.log('✅ WikiArt session created:', sessionKey.substring(0, 10) + '...');

    // Store for future use
    await storeSession(sessionKey);

    return sessionKey;
  } catch (error) {
    console.error('❌ WikiArt session creation failed:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Request headers:', error.config?.headers);
    }
    throw error;
  }
};

// Cache for most viewed paintings (refreshed every hour)
let paintingsCache: WikiArtPainting[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const PAINTINGS_STORAGE_KEY = 'wikiart_paintings';

interface StoredPaintings {
  paintings: WikiArtPainting[];
  expiresAt: number;
}

// Get stored paintings from Chrome storage
const getStoredPaintings = async (): Promise<WikiArtPainting[] | null> => {
  const storage = getChromeStorage();

  if (storage) {
    return new Promise((resolve) => {
      storage.get(PAINTINGS_STORAGE_KEY, (result: any) => {
        const stored: StoredPaintings = result[PAINTINGS_STORAGE_KEY];
        if (stored && stored.paintings && stored.expiresAt > Date.now()) {
          console.log(`✅ Found ${stored.paintings.length} stored paintings`);
          resolve(stored.paintings);
        } else {
          resolve(null);
        }
      });
    });
  } else {
    // Fallback to localStorage
    const stored = localStorage.getItem(PAINTINGS_STORAGE_KEY);
    if (stored) {
      const parsed: StoredPaintings = JSON.parse(stored);
      if (parsed.expiresAt > Date.now()) {
        console.log(`✅ Found ${parsed.paintings.length} stored paintings (localStorage)`);
        return parsed.paintings;
      }
    }
  }

  return null;
};

// Store paintings in Chrome storage
const storePaintings = async (paintings: WikiArtPainting[]): Promise<void> => {
  const storage = getChromeStorage();
  const data: StoredPaintings = {
    paintings,
    expiresAt: Date.now() + CACHE_DURATION,
  };

  if (storage) {
    return new Promise((resolve) => {
      storage.set({ [PAINTINGS_STORAGE_KEY]: data }, () => {
        console.log(`💾 Stored ${paintings.length} paintings in Chrome storage`);
        resolve();
      });
    });
  } else {
    // Fallback to localStorage
    localStorage.setItem(PAINTINGS_STORAGE_KEY, JSON.stringify(data));
    console.log(`💾 Stored ${paintings.length} paintings in localStorage`);
  }
};

// Fetch most viewed paintings (used as our pool of high-quality artworks)
const getMostViewedPaintings = async (): Promise<WikiArtPainting[]> => {
  const now = Date.now();

  // Return memory cache if fresh
  if (paintingsCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    console.log('Using paintings from memory cache');
    return paintingsCache;
  }

  // Check persistent storage
  const stored = await getStoredPaintings();
  if (stored && stored.length > 0) {
    paintingsCache = stored;
    cacheTimestamp = now;
    return paintingsCache;
  }

  // Fetch from API
  console.log('Fetching most viewed paintings from WikiArt API...');
  const session = await getSessionKey();

  const { data } = await api.get<WikiArtPaintingsResponse>(
    `/en/api/2/MostViewedPaintings`,
    {
      params: {
        authSessionKey: session,
        imageFormat: 'Large', // Get metadata with Large format
      },
    }
  );

  console.log('WikiArt API Response:', data);
  console.log('Number of paintings in response:', data.data?.length || 0);

  if (!data.data || data.data.length === 0) {
    throw new Error('No paintings found');
  }

  // Log first painting as sample
  if (data.data.length > 0) {
    console.log('Sample painting data:', data.data[0]);
  }

  // Filter to only include paintings with valid images
  paintingsCache = data.data.filter(
    (p) => p.image && p.artistName && p.title
  );

  cacheTimestamp = now;
  console.log(`✅ Cached ${paintingsCache.length} paintings from WikiArt`);

  // Store for future use
  await storePaintings(paintingsCache);

  return paintingsCache;
};

// Get image URL in specific format
const getImageUrl = (painting: WikiArtPainting, format: string): string => {
  // WikiArt image URL format: https://uploads[0-9].wikiart.org/[id]/images/[artist]/[painting].[ext]!Format.jpg
  // The format is a suffix like !Large.jpg, !HD.jpg, not a directory
  const baseImageUrl = painting.image;

  console.log('Original image URL:', baseImageUrl);
  console.log('Requested format:', format);

  // WikiArt uses format suffixes like !Large.jpg, !HD.jpg
  // Replace the existing format suffix with the requested one
  if (baseImageUrl.includes('!')) {
    // URL has a format suffix like !Large.jpg
    const newUrl = baseImageUrl.replace(/![A-Za-z]+\.jpg$/, `!${format}.jpg`);
    console.log('Replaced format suffix:', newUrl);
    return newUrl;
  } else {
    // No format suffix, add one
    // Replace .jpg extension with !Format.jpg
    const newUrl = baseImageUrl.replace(/\.jpg$/, `!${format}.jpg`);
    console.log('Added format suffix:', newUrl);
    return newUrl;
  }
};

export const fetchRandomArtwork = async (): Promise<Artwork> => {
  try {
    // Get pool of most viewed paintings
    const paintings = await getMostViewedPaintings();

    // Pick a random painting
    const randomPainting = paintings[Math.floor(Math.random() * paintings.length)];
    console.log('WikiArt artwork selected:', randomPainting.title);
    console.log('Full painting data:', randomPainting);

    // Generate image URLs for progressive loading
    // Use PinterestSmall (~200x200) for instant load, HD (1920x1200) for best quality
    // Available formats: PinterestSmall, Small, Large, HD
    const imageUrlSmall = getImageUrl(randomPainting, 'PinterestSmall');
    const imageUrlHD = getImageUrl(randomPainting, 'HD');

    console.log('Final URLs - Small:', imageUrlSmall);
    console.log('Final URLs - HD:', imageUrlHD);

    return {
      id: String(randomPainting.id),
      title: randomPainting.title || 'Untitled',
      artist: randomPainting.artistName || 'Unknown Artist',
      date: randomPainting.completitionYear ? String(randomPainting.completitionYear) : 'Date Unknown',
      imageUrl: imageUrlHD,
      imageUrlSmall: imageUrlSmall,
      museum: 'wikiart',
    };
  } catch (error) {
    console.error('Error fetching artwork from WikiArt:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};
