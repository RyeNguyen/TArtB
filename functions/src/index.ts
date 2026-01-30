import {onRequest} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {setGlobalOptions} from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import {fetchWikiArtArtworks} from './services/wikiArtService';
import {fetchArticArtworks} from './services/articService';
import {fetchMetArtworks} from './services/metService';
import {Artwork} from './types';

// Initialize Firebase Admin
admin.initializeApp();

// Set global options
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
});

/**
 * Fetch artworks from all museums and store in Firestore
 */
const refreshArtworks = async (): Promise<{success: boolean; stats: any}> => {
  try {
    logger.info('Starting artwork refresh...');

    // Get Firestore instance for pagination tracking
    const db = admin.firestore();

    // Fetch larger batches daily - runs once per day at 9 PM UTC
    // Strategy: Fetch 200 WikiArt (continues from last position), 100 ARTIC, 100 Met
    // WikiArt pagination state is saved to Firestore for continuous fetching
    const [wikiArtworks, articArtworks, metArtworks] = await Promise.all([
      fetchWikiArtArtworks(200, db), // Pass db for pagination tracking
      fetchArticArtworks(100),
      fetchMetArtworks(100),
    ]);

    const allArtworks = [...wikiArtworks, ...articArtworks, ...metArtworks];
    logger.info(`Total artworks fetched: ${allArtworks.length}`);

    if (allArtworks.length === 0) {
      logger.warn('No artworks fetched from any source');
      return {success: false, stats: {total: 0}};
    }

    // Filter out duplicates by checking Firestore
    const artworksRef = db.collection('artworks');

    logger.info('Checking for duplicates in Firestore...');
    const newArtworks: Artwork[] = [];
    let duplicateCount = 0;

    // Check in batches of 100 (Firestore getAll limit is 500)
    for (let i = 0; i < allArtworks.length; i += 100) {
      const chunk = allArtworks.slice(i, i + 100);
      const docRefs = chunk.map((art) => artworksRef.doc(art.id));
      const docs = await db.getAll(...docRefs);

      chunk.forEach((artwork, index) => {
        if (!docs[index].exists) {
          newArtworks.push(artwork);
        } else {
          duplicateCount++;
        }
      });
    }

    logger.info(`Found ${newArtworks.length} new artworks, ${duplicateCount} duplicates (skipped)`);

    // Store only new artworks in Firestore using batch writes
    const batchSize = 500; // Firestore batch limit
    let totalWritten = 0;

    for (let i = 0; i < newArtworks.length; i += batchSize) {
      const batch = db.batch();
      const chunk = newArtworks.slice(i, i + batchSize);

      chunk.forEach((artwork: Artwork) => {
        const docRef = artworksRef.doc(artwork.id);
        batch.set(docRef, artwork);
      });

      await batch.commit();
      totalWritten += chunk.length;
      logger.info(`Written ${totalWritten}/${newArtworks.length} new artworks to Firestore`);
    }

    const stats = {
      total: allArtworks.length,
      new: newArtworks.length,
      duplicates: duplicateCount,
      wikiart: wikiArtworks.length,
      artic: articArtworks.length,
      met: metArtworks.length,
      timestamp: Date.now(),
    };

    // Store stats in Firestore
    await db.collection('metadata').doc('last_refresh').set(stats);

    logger.info('Artwork refresh completed successfully', stats);
    return {success: true, stats};
  } catch (error) {
    logger.error('Error refreshing artworks:', error);
    throw error;
  }
};

/**
 * HTTP Function to manually trigger artwork refresh
 * Call this URL to refresh artworks: https://us-central1-[PROJECT-ID].cloudfunctions.net/refreshArtworksHttp
 */
export const refreshArtworksHttp = onRequest({
  timeoutSeconds: 540, // 9 minutes (max for HTTP functions)
  memory: '512MiB',
}, async (req, res) => {
  try {
    const result = await refreshArtworks();
    res.json(result);
  } catch (error) {
    logger.error('HTTP refresh failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Scheduled Function to refresh artworks daily
 * Runs every day at 9 PM UTC (4 AM Vietnam time)
 */
export const refreshArtworksScheduled = onSchedule({
  schedule: 'every day 21:00',
  timeZone: 'UTC',
  timeoutSeconds: 540,
  memory: '512MiB',
}, async (_event) => {
  logger.info('Scheduled artwork refresh triggered');
  await refreshArtworks();
});

/**
 * HTTP Function to get artwork refresh status
 */
export const getRefreshStatus = onRequest(async (req, res) => {
  try {
    const db = admin.firestore();
    const metaDoc = await db.collection('metadata').doc('last_refresh').get();

    if (!metaDoc.exists) {
      res.json({
        refreshed: false,
        message: 'No artworks have been refreshed yet',
      });
      return;
    }

    const stats = metaDoc.data();
    res.json({
      refreshed: true,
      ...stats,
      lastRefreshDate: new Date(stats?.timestamp || 0).toISOString(),
    });
  } catch (error) {
    logger.error('Error getting refresh status:', error);
    res.status(500).json({error: 'Failed to get status'});
  }
});

/**
 * ONE-TIME Migration: Update 'square' orientation to 'landscape'
 * Call once to fix existing artworks, then delete this function
 */
export const migrateSquareToLandscape = onRequest({
  timeoutSeconds: 300,
  memory: '512MiB',
}, async (req, res) => {
  try {
    const db = admin.firestore();
    const artworksRef = db.collection('artworks');

    // Query all artworks with orientation = 'square'
    const squareArtworks = await artworksRef
      .where('orientation', '==', 'square')
      .get();

    if (squareArtworks.empty) {
      res.json({
        success: true,
        message: 'No artworks with square orientation found',
        updated: 0,
      });
      return;
    }

    logger.info(`Found ${squareArtworks.size} artworks with square orientation`);

    // Update in batches of 500 (Firestore limit)
    const batchSize = 500;
    let totalUpdated = 0;
    const docs = squareArtworks.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = docs.slice(i, i + batchSize);

      chunk.forEach((doc) => {
        batch.update(doc.ref, {orientation: 'landscape'});
      });

      await batch.commit();
      totalUpdated += chunk.length;
      logger.info(`Updated ${totalUpdated}/${docs.length} artworks`);
    }

    res.json({
      success: true,
      message: `Updated ${totalUpdated} artworks from 'square' to 'landscape'`,
      updated: totalUpdated,
    });
  } catch (error) {
    logger.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
