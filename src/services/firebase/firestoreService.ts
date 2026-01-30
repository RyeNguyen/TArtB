import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from './config';
import { Artwork } from '../../types/artwork';

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
 */
export const fetchRandomArtworkFromFirestore = async (
  museum: 'artic' | 'met' | 'wikiart' | 'random' = 'random'
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
      const artworks: Artwork[] = [];
      fallbackSnapshot.forEach((doc) => {
        artworks.push(doc.data() as Artwork);
      });

      const randomIndex = Math.floor(Math.random() * artworks.length);
      const artwork = artworks[randomIndex];
      console.log('✅ Artwork fetched from Firestore (fallback):', artwork.title);
      return artwork;
    }

    // Convert to array of artworks
    const artworks: Artwork[] = [];
    querySnapshot.forEach((doc) => {
      artworks.push(doc.data() as Artwork);
    });

    // Pick a random artwork from the results
    const randomIndex = Math.floor(Math.random() * artworks.length);
    const artwork = artworks[randomIndex];

    // console.log(`✅ Artwork fetched from Firestore (${deviceOrientation}):`, artwork.title);
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
