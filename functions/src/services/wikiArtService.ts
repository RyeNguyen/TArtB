import axios from 'axios';
// import {config} from '../config'; // Not needed - no authentication required
import {Artwork, WikiArtPaintingsResponse, WikiArtPainting} from '../types';
import * as logger from 'firebase-functions/logger';
import {Firestore} from 'firebase-admin/firestore';

const BASE_URL = 'https://www.wikiart.org';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: false,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Session management - NOT NEEDED for public MostViewedPaintings endpoint!
// WikiArt allows anonymous access without authentication
// Keeping this code commented in case we need authenticated endpoints later
/*
let sessionKey: string | null = null;

const getSessionKey = async (): Promise<string> => {
  if (sessionKey) {
    return sessionKey;
  }

  try {
    logger.info('Creating WikiArt session...');
    const {data} = await api.get<WikiArtSession>(
      `/en/Api/2/login?accessCode=${config.wikiart.accessCode}&secretCode=${config.wikiart.secretCode}`
    );

    if (!data.SessionKey) {
      throw new Error('Failed to create WikiArt session');
    }

    sessionKey = data.SessionKey;
    logger.info('WikiArt session created successfully');
    return sessionKey;
  } catch (error) {
    logger.error('WikiArt session creation failed:', error);
    throw error;
  }
};
*/

// Get image URL in specific format
const getImageUrl = (painting: WikiArtPainting, format: string): string => {
  const baseImageUrl = painting.image;

  // WikiArt uses format suffixes like !Large.jpg, !HD.jpg
  if (baseImageUrl.includes('!')) {
    return baseImageUrl.replace(/![A-Za-z]+\.jpg$/, `!${format}.jpg`);
  } else {
    return baseImageUrl.replace(/\.jpg$/, `!${format}.jpg`);
  }
};

// Retry helper with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Only retry on 500 errors (server issues)
      if (error.response?.status === 500 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        logger.warn(`WikiArt API error 500, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw lastError;
};

// Pagination state document path
const PAGINATION_STATE_DOC = 'metadata/wikiart_pagination';

// Load saved pagination state from Firestore
const loadPaginationState = async (db: Firestore): Promise<{token?: string; pageNumber: number}> => {
  try {
    const doc = await db.doc(PAGINATION_STATE_DOC).get();
    if (doc.exists) {
      const data = doc.data();
      return {
        token: data?.paginationToken,
        pageNumber: data?.pageNumber || 0,
      };
    }
  } catch (error) {
    logger.warn('Failed to load pagination state, starting from page 1:', error);
  }
  return {token: undefined, pageNumber: 0};
};

// Save pagination state to Firestore
const savePaginationState = async (
  db: Firestore,
  token: string | undefined,
  pageNumber: number,
  hasMore: boolean
): Promise<void> => {
  try {
    if (!hasMore) {
      // Reached the end, reset to start from page 1 next time
      logger.info('Reached end of WikiArt artworks, resetting pagination for next run');
      await db.doc(PAGINATION_STATE_DOC).set({
        paginationToken: null,
        pageNumber: 0,
        reachedEnd: true,
        lastReset: Date.now(),
      });
    } else {
      // Save current position for next run
      await db.doc(PAGINATION_STATE_DOC).set({
        paginationToken: token,
        pageNumber,
        reachedEnd: false,
        lastUpdated: Date.now(),
      });
      logger.info(`Saved pagination state: page ${pageNumber}`);
    }
  } catch (error) {
    logger.error('Failed to save pagination state:', error);
  }
};

// Fetch artworks with pagination support - continues from last position
export const fetchWikiArtArtworks = async (
  maxArtworks: number = 100,
  db?: Firestore
): Promise<Artwork[]> => {
  const artworks: Artwork[] = []; // Declare outside try block so catch can access it

  try {
    logger.info(`Fetching up to ${maxArtworks} artworks from WikiArt...`);

    // Load saved pagination state if Firestore is provided
    let paginationToken: string | undefined;
    let startPageNumber = 0;

    if (db) {
      const state = await loadPaginationState(db);
      paginationToken = state.token;
      startPageNumber = state.pageNumber;
      if (paginationToken) {
        logger.info(`Resuming from saved position: page ${startPageNumber}`);
      } else {
        logger.info('Starting from page 1 (no saved state or reset)');
      }
    }

    let hasMore = true;
    let pageCount = 0;
    let absolutePageNumber = startPageNumber;
    let lastValidToken = paginationToken;

    // Keep fetching until we have enough artworks or no more pages
    while (artworks.length < maxArtworks && hasMore && pageCount < 20) {
      pageCount++;
      absolutePageNumber++;

      try {
        logger.info(`Fetching WikiArt page ${absolutePageNumber} (batch page ${pageCount})...`);

        // Build URL manually to avoid double-encoding the pagination token
        // WikiArt returns an already-encoded token, so we pass it directly in the URL
        // If we use axios params, it will encode it again: %2f → %252f (double encoding)
        const url = paginationToken
          ? `/en/api/2/MostViewedPaintings?paginationToken=${paginationToken}`
          : `/en/api/2/MostViewedPaintings`;

        const {data} = await retryWithBackoff(() =>
          api.get<WikiArtPaintingsResponse>(url)
        );

        if (!data.data || data.data.length === 0) {
          logger.warn('No more paintings found from WikiArt - reached the end');
          hasMore = false;
          break;
        }

        // Process paintings from this page
        const pagePaintings = data.data
          .filter((p) => p.image && p.artistName && p.title && p.width && p.height)
          .map((p) => {
            const aspectRatio = p.width / p.height;
            // Only use 'landscape' or 'portrait' - square images go to landscape
            // (matches frontend getDeviceOrientation which only returns these two)
            const orientation: 'landscape' | 'portrait' = aspectRatio >= 1 ? 'landscape' : 'portrait';

            return {
              id: `wikiart_${p.id}`,
              title: p.title || 'Untitled',
              artist: p.artistName || 'Unknown Artist',
              date: p.completitionYear ? String(p.completitionYear) : 'Date Unknown',
              imageUrl: getImageUrl(p, 'HD'),
              imageUrlSmall: getImageUrl(p, 'Large'),
              museum: 'wikiart' as const,
              aspectRatio,
              orientation,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
          });

        artworks.push(...pagePaintings);
        logger.info(`WikiArt page ${absolutePageNumber}: fetched ${pagePaintings.length} artworks (total: ${artworks.length})`);

        // Update pagination state
        paginationToken = data.paginationToken;
        hasMore = data.hasMore;
        lastValidToken = paginationToken;

        // Add random delay (500-1500ms) to look more human and respect rate limits
        const randomDelay = 500 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
      } catch (pageError: any) {
        logger.warn(`Failed to fetch WikiArt page ${absolutePageNumber} after retries: ${pageError.message}`);

        // When pagination fails, we can't continue because we don't have the next token
        // Stop and return what we've collected so far
        if (artworks.length > 0) {
          logger.warn(`Pagination failed but returning ${artworks.length} artworks already fetched.`);
          break;
        } else {
          // No artworks yet and hitting errors, bail out completely
          throw pageError;
        }
      }
    }

    // Save pagination state for next run
    if (db) {
      await savePaginationState(db, lastValidToken, absolutePageNumber, hasMore);
    }

    // Trim to max if we got more than requested
    const result = artworks.slice(0, maxArtworks);
    logger.info(`Fetched ${result.length} artworks from WikiArt (pages ${startPageNumber + 1}-${absolutePageNumber})`);
    return result;
  } catch (error) {
    logger.error('Error fetching WikiArt artworks:', error);
    // Return what we've fetched so far instead of empty array
    if (artworks.length > 0) {
      logger.info(`Returning ${artworks.length} artworks despite errors`);
      return artworks.slice(0, maxArtworks);
    }
    return []; // Only return empty if we got nothing
  }
};
