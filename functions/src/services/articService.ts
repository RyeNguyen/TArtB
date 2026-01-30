import axios from 'axios';
import {Artwork, ArticResponse} from '../types';
import * as logger from 'firebase-functions/logger';

const BASE_URL = 'https://api.artic.edu/api/v1';
const IMAGE_BASE_URL = 'https://www.artic.edu/iiif/2';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Curated list of high-quality paintings from ARTIC
const CURATED_PAINTINGS = [
  // Impressionist Masterpieces
  27992, 28067, 81558, 16487, 28560, 14598, 14655, 16298, 16568, 14572,
  // American Art
  6565, 83642, 87479, 109275, 111060, 80607, 79307, 184372, 109819, 87478,
  // European Paintings
  16298, 16487, 14655, 27992, 28560, 14572, 14598, 81558, 28067, 16568,
  // Modern Art
  109819, 184372, 87478, 87479, 80607, 111060, 109275, 79307, 83642,
  // Post-Impressionism
  28560, 81558, 27992, 14655, 16487, 14598, 28067, 16568, 14572,
  // 19th Century
  111317, 109819, 16298, 87479, 80607, 14655, 109275, 184372, 79307,
  // 20th Century
  109929, 111060, 83642, 87478, 229358, 229371, 149772, 111628,
  // Additional High-Quality Works
  16571, 20579, 27984, 28670, 81515, 87644, 111436, 111442, 111616, 111623,
  14574, 14591, 14620, 16313, 16323, 16327, 16353, 16362, 16426, 16429,
  20684, 20540, 22670, 23893, 24278, 25857, 27943, 27955, 27963, 28025,
  80531, 80538, 80617, 81531, 81535, 81559, 81565, 81580, 83795, 84041,
  86385, 87651, 109260, 109439, 109780, 109857, 110487, 111317, 111380,
];

export const fetchArticArtworks = async (limit: number = 100): Promise<Artwork[]> => {
  try {
    logger.info(`Fetching ${limit} artworks from ARTIC...`);
    const artworks: Artwork[] = [];

    // Limit to the requested number, remove duplicates first
    const uniqueIds = [...new Set(CURATED_PAINTINGS)];
    const idsToFetch = uniqueIds.slice(0, limit);

    for (const id of idsToFetch) {
      try {
        const {data} = await api.get<ArticResponse>(
          `/artworks/${id}?fields=id,title,artist_display,date_display,image_id,description,credit_line,department_title`
        );

        if (!data.data || !data.data.image_id) {
          continue;
        }

        const artwork = data.data;
        const imageId = artwork.image_id;

        // ARTIC doesn't provide dimensions easily
        // Assume landscape for most classical museum paintings
        const aspectRatio = 1.3;
        // Only 'landscape' or 'portrait' (matches frontend getDeviceOrientation)
        const orientation: 'landscape' | 'portrait' = 'landscape';

        artworks.push({
          id: `artic_${artwork.id}`,
          title: artwork.title || 'Untitled',
          artist: artwork.artist_display || 'Unknown Artist',
          date: artwork.date_display || 'Date Unknown',
          imageUrl: `${IMAGE_BASE_URL}/${imageId}/full/843,/0/default.jpg`,
          imageUrlSmall: `${IMAGE_BASE_URL}/${imageId}/full/400,/0/default.jpg`,
          description: artwork.description,
          museum: 'artic' as const,
          creditLine: artwork.credit_line,
          department: artwork.department_title,
          aspectRatio,
          orientation,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Add random delay (300-800ms) to look more human and avoid rate limiting
        const randomDelay = 300 + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
      } catch (error) {
        logger.warn(`Failed to fetch ARTIC artwork ${id}:`, error);
      }
    }

    logger.info(`Fetched ${artworks.length} artworks from ARTIC`);
    return artworks;
  } catch (error) {
    logger.error('Error fetching ARTIC artworks:', error);
    return [];
  }
};
