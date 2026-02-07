/**
 * Color Extraction Status Checker
 *
 * Checks how many artworks have color data vs. need processing
 *
 * Usage: node scripts/checkColorStatus.js
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account key
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "../serviceAccountKey.json"), "utf8")
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkStatus() {
  console.log('🔍 Checking color extraction status...\n');

  try {
    const snapshot = await db.collection('artworks').get();

    const stats = {
      total: snapshot.size,
      withColors: 0,
      withoutColors: 0,
      withoutImage: 0,
      byMuseum: {
        wikiart: { total: 0, withColors: 0, withoutColors: 0 },
        artic: { total: 0, withColors: 0, withoutColors: 0 },
        met: { total: 0, withColors: 0, withoutColors: 0 },
      },
    };

    const needProcessing = [];
    const noImageUrl = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const museum = data.museum || 'unknown';

      // Track by museum
      if (stats.byMuseum[museum]) {
        stats.byMuseum[museum].total++;
      }

      if (!data.imageUrl) {
        stats.withoutImage++;
        noImageUrl.push({ id: doc.id, title: data.title, museum });
      } else if (data.colors) {
        stats.withColors++;
        if (stats.byMuseum[museum]) {
          stats.byMuseum[museum].withColors++;
        }
      } else {
        stats.withoutColors++;
        if (stats.byMuseum[museum]) {
          stats.byMuseum[museum].withoutColors++;
        }
        needProcessing.push({
          id: doc.id,
          title: data.title,
          artist: data.artist,
          museum,
        });
      }
    });

    // Print summary
    console.log('📊 STATUS SUMMARY\n');
    console.log('─'.repeat(60));
    console.log(`Total artworks:           ${stats.total}`);
    console.log(`✅ With colors:            ${stats.withColors} (${Math.round(stats.withColors / stats.total * 100)}%)`);
    console.log(`❌ Need processing:        ${stats.withoutColors} (${Math.round(stats.withoutColors / stats.total * 100)}%)`);
    console.log(`⚠️  No image URL:          ${stats.withoutImage}`);
    console.log('─'.repeat(60));

    // Museum breakdown
    console.log('\n📚 BY MUSEUM:\n');
    Object.entries(stats.byMuseum).forEach(([museum, data]) => {
      if (data.total > 0) {
        const percentage = Math.round(data.withColors / data.total * 100);
        console.log(`${museum.toUpperCase()}:`);
        console.log(`  Total: ${data.total}`);
        console.log(`  ✅ With colors: ${data.withColors} (${percentage}%)`);
        console.log(`  ❌ Need processing: ${data.withoutColors}`);
        console.log();
      }
    });
    console.log('─'.repeat(60));

    if (stats.withoutColors > 0) {
      const wikiartNeedProcessing = needProcessing.filter(art => art.museum === 'wikiart');
      const otherMuseumCount = needProcessing.length - wikiartNeedProcessing.length;

      console.log(`\n📝 WikiArt artworks needing color extraction (${Math.min(10, wikiartNeedProcessing.length)} of ${wikiartNeedProcessing.length}):\n`);
      wikiartNeedProcessing.slice(0, 10).forEach((art, i) => {
        console.log(`${i + 1}. ${art.title} by ${art.artist}`);
        console.log(`   ID: ${art.id}`);
      });

      if (wikiartNeedProcessing.length > 10) {
        console.log(`\n   ... and ${wikiartNeedProcessing.length - 10} more`);
      }

      if (otherMuseumCount > 0) {
        console.log(`\n⏭️  ${otherMuseumCount} artworks from other museums (ARTIC, Met) will be skipped`);
      }

      console.log(`\n💡 Run the batch extraction script (WikiArt only):`);
      console.log(`   npm run extract-colors\n`);
    } else {
      console.log('\n✅ All artworks have color data! 🎉\n');
    }

    if (stats.withoutImage > 0) {
      console.log(`\n⚠️  ${stats.withoutImage} artworks have no image URL:\n`);
      noImageUrl.slice(0, 5).forEach((art, i) => {
        console.log(`${i + 1}. ${art.title || 'Untitled'}`);
        console.log(`   ID: ${art.id}`);
      });
      if (noImageUrl.length > 5) {
        console.log(`   ... and ${noImageUrl.length - 5} more`);
      }
      console.log();
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkStatus();
