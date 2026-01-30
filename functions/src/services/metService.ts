import axios from 'axios';
import {Artwork, MetArtwork} from '../types';
import * as logger from 'firebase-functions/logger';

const BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Curated list of paintings from Met Museum
const CURATED_ARTWORKS = [
  // European Paintings - Dutch Golden Age
  436535, 436532, 436528, 437394, 437397, 437396, 437133, 438815, 459055,
  436121, 436533, 436540, 436527, 437311, 436829, 438817, 438821, 459080,
  459086, 436962, 437112, 437329, 438013, 437853, 437854, 436105, 435809,
  // European Paintings - French
  437398, 437401, 437404, 437407, 437408, 437409, 437410, 437984, 438684,
  438817, 436960, 436961, 436963, 436964, 436965, 437133, 437135, 437136,
  // European Paintings - Italian Renaissance
  435844, 435845, 435846, 435847, 435848, 435849, 435850, 435851, 435852,
  435882, 435883, 435884, 435885, 435886, 435887, 435888, 435889, 435890,
  // European Paintings - Spanish
  436545, 436546, 436547, 436548, 436549, 436550, 436551, 437325, 437326,
  437327, 437328, 438008, 438009, 438010, 438011, 438012,
  // American Paintings - Hudson River School & Landscapes
  11867, 11780, 12697, 10490, 10799, 12039, 11664, 12127, 10983, 13018,
  11145, 12095, 12153, 11760, 11212, 14415, 11298, 11767, 10186, 11887,
  10143, 10144, 10145, 10146, 10491, 10492, 10493, 10494, 10495,
  // American Paintings - Portraits & Genre
  12078, 12079, 12080, 12081, 12082, 12083, 12084, 12085, 12086, 12087,
  11708, 11709, 11710, 11711, 11712, 11713, 11714, 11715, 11716,
  // Impressionist & Post-Impressionist
  437311, 437329, 437133, 438815, 438817, 436962, 437112, 436829, 438821,
  437984, 436960, 436961, 436963, 436964, 436965, 437135, 437136,
];

export const fetchMetArtworks = async (limit: number = 100): Promise<Artwork[]> => {
  try {
    logger.info(`Fetching ${limit} artworks from Met Museum...`);
    const artworks: Artwork[] = [];

    // Remove duplicates and limit
    const uniqueIds = [...new Set(CURATED_ARTWORKS)];
    const idsToFetch = uniqueIds.slice(0, limit);

    for (const objectID of idsToFetch) {
      try {
        const {data: artwork} = await api.get<MetArtwork>(`/objects/${objectID}`);

        if (!artwork.primaryImage && !artwork.primaryImageSmall) {
          continue;
        }

        // Met Museum doesn't provide pixel dimensions directly
        // Assume landscape for most classical museum paintings
        // Only 'landscape' or 'portrait' (matches frontend getDeviceOrientation)
        const aspectRatio = 1.3; // Typical landscape painting
        const orientation: 'landscape' | 'portrait' = 'landscape';

        artworks.push({
          id: `met_${artwork.objectID}`,
          title: artwork.title || 'Untitled',
          artist: artwork.artistDisplayName || 'Unknown Artist',
          date: artwork.objectDate || 'Date Unknown',
          imageUrl: artwork.primaryImage,
          imageUrlSmall: artwork.primaryImageSmall,
          museum: 'met' as const,
          creditLine: artwork.creditLine,
          department: artwork.department,
          aspectRatio,
          orientation,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Add random delay (300-800ms) to look more human and avoid rate limiting
        const randomDelay = 300 + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
      } catch (error) {
        logger.warn(`Failed to fetch Met artwork ${objectID}:`, error);
      }
    }

    logger.info(`Fetched ${artworks.length} artworks from Met Museum`);
    return artworks;
  } catch (error) {
    logger.error('Error fetching Met artworks:', error);
    return [];
  }
};
