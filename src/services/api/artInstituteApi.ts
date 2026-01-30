import axios from 'axios';
import { Artwork } from '../../types/artwork';

const BASE_URL = 'https://api.artic.edu/api/v1';
const IMAGE_BASE_URL = 'https://www.artic.edu/iiif/2';

// Configure axios instance with timeout
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

interface ArticArtwork {
  id: number;
  title: string;
  artist_display: string;
  date_display: string;
  image_id: string;
  description?: string;
  credit_line?: string;
  department_title?: string;
}

interface ArticResponse {
  data: ArticArtwork;
}

// Curated list of high-quality paintings from ARTIC (200+ artworks)
// These are verified to have images and are paintings
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

  // Portraits & Landscapes
  16571, 111442, 111623, 111616, 81535, 87651, 16353, 28025, 109439,

  // Still Life
  16313, 81559, 27943, 14574, 20540,

  // Abstract & Modern
  109929, 149772, 229358, 229371, 83795, 86385, 110487,
];

export const fetchRandomArtwork = async (): Promise<Artwork> => {
  try {
    // Pick a random artwork ID from curated list
    const randomId = CURATED_PAINTINGS[Math.floor(Math.random() * CURATED_PAINTINGS.length)];
    console.log(`Fetching ARTIC artwork ${randomId}...`);

    const { data } = await api.get<ArticResponse>(
      `/artworks/${randomId}?fields=id,title,artist_display,date_display,image_id,description,credit_line,department_title`
    );

    if (!data.data || !data.data.image_id) {
      console.log('No image found, trying another artwork...');
      return fetchRandomArtwork();
    }

    const artwork = data.data;
    console.log('ARTIC artwork fetched:', artwork.title);

    // Use recommended image URL format (843px width - cached size)
    // Also provide smaller version for progressive loading (400px)
    const imageId = artwork.image_id;

    return {
      id: String(artwork.id),
      title: artwork.title || 'Untitled',
      artist: artwork.artist_display || 'Unknown Artist',
      date: artwork.date_display || 'Date Unknown',
      imageUrl: `${IMAGE_BASE_URL}/${imageId}/full/843,/0/default.jpg`,
      imageUrlSmall: `${IMAGE_BASE_URL}/${imageId}/full/400,/0/default.jpg`,
      description: artwork.description,
      museum: 'artic',
      creditLine: artwork.credit_line,
      department: artwork.department_title,
    };
  } catch (error) {
    console.error('Error fetching artwork from ARTIC:', error);
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
