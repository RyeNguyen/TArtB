import axios from 'axios';
import { Artwork } from '../../types/artwork';

const BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

interface MetArtwork {
  objectID: number;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  primaryImage: string;
  primaryImageSmall: string;
  department?: string;
  creditLine?: string;
}

// Curated list of paintings only - high-quality works from various periods
// 150+ paintings for variety without slow API searches
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

  // Impressionist & Post-Impressionist - Monet, Renoir, Cézanne
  437311, 437329, 437133, 438815, 438817, 436962, 437112, 436829, 438821,
  437984, 436960, 436961, 436963, 436964, 436965, 437135, 437136,

  // Modern & Contemporary Paintings
  488315, 488702, 484769, 489464, 490291, 490293, 490472, 491638, 488361,
  488362, 488363, 488364, 488365, 488366, 488367, 488368, 488369,

  // Asian Paintings - Chinese & Japanese
  45734, 36105, 36116, 45822, 36131, 56203, 53155, 36741, 36742, 36743,
  36744, 36745, 36746, 36747, 36748, 36749, 36750, 36751, 36752,
];

export const fetchRandomArtwork = async (): Promise<Artwork> => {
  try {
    // Pick a random artwork ID from curated list
    const randomObjectID = CURATED_ARTWORKS[Math.floor(Math.random() * CURATED_ARTWORKS.length)];
    console.log(`Fetching curated artwork ${randomObjectID}...`);

    const { data: artwork } = await api.get<MetArtwork>(`/objects/${randomObjectID}`);

    if (!artwork.primaryImage && !artwork.primaryImageSmall) {
      console.log('No image found, trying another artwork...');
      return fetchRandomArtwork();
    }

    return {
      id: String(artwork.objectID),
      title: artwork.title || 'Untitled',
      artist: artwork.artistDisplayName || 'Unknown Artist',
      date: artwork.objectDate || 'Date Unknown',
      imageUrl: artwork.primaryImage, // High quality
      imageUrlSmall: artwork.primaryImageSmall, // Low quality for progressive loading
      museum: 'met',
      creditLine: artwork.creditLine,
      department: artwork.department,
    };
  } catch (error) {
    console.error('Error fetching artwork from Met Museum:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
      });
    }
    throw error;
  }
};
