import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from './config';
import { Artwork } from '../../types/artwork';
import { calculateMoodMatch } from '@utils/colorUtils';

/**
 * Detect device orientation based on screen dimensions
 */
const getDeviceOrientation = (): 'landscape' | 'portrait' => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return width > height ? 'landscape' : 'portrait';
};

/**
 * Fetch a random artwork from Firestore
 * @param museum - Filter by museum ('artic', 'met', 'wikiart', or 'random')
 * @param mood - Optional mood filter (e.g., 'rainy', 'sunny', 'calm')
 */
export const fetchRandomArtworkFromFirestore = async (
  museum: 'artic' | 'met' | 'wikiart' | 'random' = 'random',
  mood?: string
): Promise<Artwork> => {
  try {
    // Detect device orientation
    // const deviceOrientation = getDeviceOrientation();
    console.log(`Fetching artwork from Firestore (museum: ${museum}`);

    const artworksRef = collection(db, 'artworks');

    // Build query based on museum selection AND device orientation
    let q;
    if (museum === 'random') {
      // Get artworks matching device orientation from all museums
      q = query(
        artworksRef,
        // where('orientation', '==', deviceOrientation),
        // limit(50) // Get 50 random artworks to choose from
      );
    } else {
      // Filter by specific museum AND device orientation
      q = query(
        artworksRef,
        where('museum', '==', museum),
        // where('orientation', '==', deviceOrientation),
        // limit(50) // Get 50 artworks from this museum
      );
    }

    const querySnapshot = await getDocs(q);

    // Fallback: If no artworks match orientation, try without orientation filter
    if (querySnapshot.empty) {
      // console.warn(`No ${deviceOrientation} artworks found, trying without orientation filter...`);

      if (museum === 'random') {
        q = query(artworksRef, limit(50));
      } else {
        q = query(
          artworksRef,
          where('museum', '==', museum),
          // limit(50)
        );
      }

      const fallbackSnapshot = await getDocs(q);

      if (fallbackSnapshot.empty) {
        throw new Error(`No artworks found in Firestore for museum: ${museum}`);
      }

      // Convert fallback results
      let artworks: Artwork[] = [];
      fallbackSnapshot.forEach((doc) => {
        artworks.push(doc.data() as Artwork);
      });

      // Filter by mood if specified
      if (mood && artworks.length > 0) {
        console.log(`🎨 Filtering fallback artworks by mood: ${mood}`);

        const matchedArtworks = artworks.filter(artwork => {
          if (!artwork.colors) return false;

          const score = calculateMoodMatch(artwork.colors, mood);
          return score >= 50; // Match threshold: 50%
        });

        if (matchedArtworks.length > 0) {
          console.log(`✅ Found ${matchedArtworks.length} fallback artworks matching mood "${mood}"`);
          artworks = matchedArtworks;
        }
      }

      const randomIndex = Math.floor(Math.random() * artworks.length);
      const artwork = artworks[randomIndex];
      console.log('✅ Artwork fetched from Firestore (fallback):', artwork.title);
      return artwork;
    }

    // Convert to array of artworks
    let artworks: Artwork[] = [];
    querySnapshot.forEach((doc) => {
      artworks.push(doc.data() as Artwork);
    });

    // Filter by mood if specified
    if (mood && artworks.length > 0) {
      console.log(`🎨 Filtering artworks by mood: ${mood}`);

      const matchedArtworks = artworks.filter(artwork => {
        if (!artwork.colors) return false;

        const score = calculateMoodMatch(artwork.colors, mood);
        return score >= 50; // Match threshold: 50%
      });

      if (matchedArtworks.length === 0) {
        console.warn(`⚠️ No artworks match mood "${mood}" (threshold: 50%), showing random artwork instead`);
      } else {
        console.log(`✅ Found ${matchedArtworks.length}/${artworks.length} artworks matching mood "${mood}" (≥50% match)`);
        artworks = matchedArtworks;
      }
    }

    if (artworks.length === 0) {
      throw new Error(`No artworks found matching criteria (museum: ${museum}, mood: ${mood || 'any'})`);
    }

    // Pick a random artwork from the results
    const randomIndex = Math.floor(Math.random() * artworks.length);
    const artwork = artworks[randomIndex];

    console.log(`✅ Artwork fetched from Firestore:`, artwork.title);
    return artwork;
  } catch (error) {
    console.error('Error fetching artwork from Firestore:', error);
    throw error;
  }
};

/**
 * Get refresh status/stats from Firestore
 */
export const getRefreshStats = async () => {
  try {
    const metadataRef = collection(db, 'metadata');
    const q = query(metadataRef, limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching refresh stats:', error);
    return null;
  }
};
