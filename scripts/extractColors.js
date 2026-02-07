import admin from "firebase-admin";
import Vibrant from "node-vibrant";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";
import http from "http";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account key
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "../serviceAccountKey.json"), "utf8"),
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Get base/default URL by removing WikiArt size suffixes
 * Same logic as frontend getDefaultUrl()
 */
function getDefaultUrl(url) {
  if (url.includes("wikiart.org")) {
    // Handle two formats due to API inconsistency
    // Format 1: .../painting.jpg!HD.jpg → .../painting.jpg
    // Format 2: .../painting!HD.jpg → .../painting.jpg
    if (/\.jpg![A-Za-z]+\.jpg$/i.test(url)) {
      // Base already has .jpg extension - just remove format suffix
      return url.replace(/![A-Za-z]+\.jpg$/i, "");
    } else {
      // Base doesn't have .jpg - replace format suffix with .jpg
      return url.replace(/![A-Za-z]+\.jpg$/i, ".jpg");
    }
  }
  return url;
}

/**
 * Download image from URL as Buffer
 */
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const request = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          if (response.headers.location) {
            downloadImage(response.headers.location)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`),
          );
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const buffer = Buffer.concat(chunks);
          if (buffer.length === 0) {
            reject(new Error("Empty response"));
            return;
          }
          resolve(buffer);
        });
        response.on("error", reject);
      },
    );

    request.on("error", reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

/**
 * Extract color analysis from image URL using node-vibrant
 */
async function extractColorsFromUrl(imageUrl) {
  try {
    // Clean up WikiArt URL (remove size suffixes like !HD.jpg)
    const cleanUrl = getDefaultUrl(imageUrl);

    if (cleanUrl !== imageUrl) {
      console.log(
        `  🔧 Cleaned URL: ${imageUrl.substring(
          imageUrl.lastIndexOf("/") + 1,
        )}`,
      );
      console.log(
        `      → ${cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1)}`,
      );
    }

    console.log(`  📥 Downloading: ${cleanUrl.substring(0, 80)}...`);

    // Download image as buffer first
    const imageBuffer = await downloadImage(cleanUrl);
    console.log(`  ✓ Downloaded ${imageBuffer.length} bytes`);

    // Extract palette using node-vibrant
    const palette = await Vibrant.from(imageBuffer).getPalette();

    // Extract dominant colors
    const dominant = [];
    const paletteData = {};

    if (palette.Vibrant) {
      dominant.push(palette.Vibrant.hex);
      paletteData.vibrant = palette.Vibrant.hex;
    }
    if (palette.DarkVibrant) {
      dominant.push(palette.DarkVibrant.hex);
      paletteData.darkVibrant = palette.DarkVibrant.hex;
    }
    if (palette.LightVibrant) {
      dominant.push(palette.LightVibrant.hex);
      paletteData.lightVibrant = palette.LightVibrant.hex;
    }
    if (palette.Muted) {
      dominant.push(palette.Muted.hex);
      paletteData.muted = palette.Muted.hex;
    }
    if (palette.DarkMuted) {
      dominant.push(palette.DarkMuted.hex);
      paletteData.darkMuted = palette.DarkMuted.hex;
    }
    if (palette.LightMuted) {
      paletteData.lightMuted = palette.LightMuted.hex;
    }

    // Use Vibrant or first available for average color
    const avgColor = palette.Vibrant || palette.Muted || palette.DarkVibrant;
    if (!avgColor) {
      throw new Error("No colors extracted");
    }

    const [h, s, l] = avgColor.hsl;
    const hue = Math.round(h * 360);
    const saturation = Math.round(s * 100);
    const brightness = Math.round(l * 100);

    // Determine temperature
    let temperature = "neutral";
    if ((hue >= 0 && hue < 60) || (hue >= 330 && hue <= 360)) {
      temperature = "warm";
    } else if (hue >= 120 && hue < 300) {
      temperature = "cool";
    }

    return {
      dominant: dominant.slice(0, 5),
      palette: paletteData,
      temperature,
      brightness,
      saturation,
      averageColor: avgColor.hex,
    };
  } catch (error) {
    console.error(`  ❌ Error extracting colors: ${error.message}`);
    return null;
  }
}

/**
 * Process a single artwork document
 */
async function processArtwork(doc) {
  const data = doc.data();
  const artworkId = doc.id;

  // Skip if not WikiArt (ARTIC and Met have CORS/403 issues)
  if (data.museum !== "wikiart") {
    console.log(
      `⏭️  Skipping ${artworkId} - ${data.museum} (only processing WikiArt)`,
    );
    return { status: "skipped-museum", id: artworkId, museum: data.museum };
  }

  // Skip if already has colors
  if (data.colors) {
    console.log(`⏭️  Skipping ${artworkId} - already has colors`);
    return { status: "skipped", id: artworkId };
  }

  console.log(`\n🎨 Processing: ${data.title} by ${data.artist}`);
  console.log(`   ID: ${artworkId}`);

  // Use HD image if available, otherwise use regular imageUrl
  const imageUrl = data.imageUrl;

  if (!imageUrl) {
    console.log(`  ⚠️  No image URL found`);
    return { status: "no-image", id: artworkId };
  }

  // Extract colors
  const colors = await extractColorsFromUrl(imageUrl);

  if (!colors) {
    return { status: "failed", id: artworkId };
  }

  // Update Firestore document
  try {
    await db.collection("artworks").doc(artworkId).update({
      colors: colors,
      colorsExtractedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`  ✅ Updated with colors:`, {
      dominant: colors.dominant,
      temperature: colors.temperature,
      brightness: colors.brightness,
      saturation: colors.saturation,
    });

    return { status: "success", id: artworkId };
  } catch (error) {
    console.error(`  ❌ Failed to update Firestore: ${error.message}`);
    return { status: "update-failed", id: artworkId, error: error.message };
  }
}

/**
 * Main batch processing function
 */
async function batchProcessArtworks() {
  console.log("🚀 Starting batch color extraction...\n");

  const stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    skippedMuseum: 0,
    noImage: 0,
    updateFailed: 0,
  };

  const failedIds = [];
  const skippedMuseums = { artic: 0, met: 0 };

  try {
    // Fetch all artworks
    console.log("📚 Fetching artworks from Firestore...");
    const snapshot = await db.collection("artworks").get();
    stats.total = snapshot.size;

    console.log(`✅ Found ${stats.total} artworks\n`);
    console.log("─".repeat(80));

    // Process each artwork
    let processed = 0;
    for (const doc of snapshot.docs) {
      processed++;
      console.log(`\n[${processed}/${stats.total}]`);

      const result = await processArtwork(doc);

      switch (result.status) {
        case "success":
          stats.success++;
          break;
        case "failed":
          stats.failed++;
          failedIds.push(result.id);
          break;
        case "skipped":
          stats.skipped++;
          break;
        case "skipped-museum":
          stats.skippedMuseum++;
          if (result.museum === "artic") skippedMuseums.artic++;
          if (result.museum === "met") skippedMuseums.met++;
          break;
        case "no-image":
          stats.noImage++;
          break;
        case "update-failed":
          stats.updateFailed++;
          failedIds.push(result.id);
          break;
      }

      // Rate limiting: wait 500ms between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Print summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 BATCH PROCESSING COMPLETE\n");
    console.log(`Total artworks:           ${stats.total}`);
    console.log(`✅ Successfully processed: ${stats.success}`);
    console.log(`⏭️  Skipped (already have colors): ${stats.skipped}`);
    console.log(`⏭️  Skipped (other museums): ${stats.skippedMuseum}`);
    if (stats.skippedMuseum > 0) {
      console.log(`    - ARTIC: ${skippedMuseums.artic}`);
      console.log(`    - Met: ${skippedMuseums.met}`);
    }
    console.log(`⚠️  No image URL: ${stats.noImage}`);
    console.log(`❌ Extraction failed: ${stats.failed}`);
    console.log(`❌ Update failed: ${stats.updateFailed}`);
    console.log("=".repeat(80));

    if (failedIds.length > 0) {
      console.log("\n❌ Failed IDs:");
      failedIds.forEach((id) => console.log(`   - ${id}`));
    }
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the batch process
batchProcessArtworks();
