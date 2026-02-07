# Batch Color Extraction Script

This script extracts color palettes from all artwork images in Firestore and updates the documents with color analysis data.

## Prerequisites

1. **Firebase Admin SDK Service Account Key**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Project Settings** → **Service Accounts**
   - Click **Generate New Private Key**
   - Save the JSON file as `serviceAccountKey.json` in the project root

2. **Install Dependencies**
   ```bash
   npm install
   ```

## Setup

1. **Add Service Account Key**
   ```bash
   # Place the downloaded JSON file in project root
   # It should be named: serviceAccountKey.json
   ```

2. **Verify .gitignore**
   Make sure `serviceAccountKey.json` is in `.gitignore` (already added):
   ```
   serviceAccountKey.json
   ```

## Usage

### Run the batch extraction:
```bash
npm run extract-colors
```

### What it does:
1. ✅ Connects to Firestore
2. ✅ Fetches all artworks
3. ✅ Downloads each image
4. ✅ Extracts color palette using `node-vibrant`:
   - 5 dominant colors
   - Vibrant, muted, dark, light variants
   - Temperature (warm/cool/neutral)
   - Brightness & saturation levels
5. ✅ Updates Firestore document with `colors` field
6. ✅ Shows progress and statistics
7. ✅ Skips artworks that already have colors
8. ✅ Handles errors gracefully

### Output Format:
```
[1/234]
🎨 Processing: Water Lilies by Claude Monet
   ID: abc123xyz
  📥 Downloading: https://uploads7.wikiart.org/images/...
  ✅ Updated with colors: {
    dominant: ['#3A5F8A', '#E8C4A0', '#1A2634', '#7A9BB5', '#C4A580'],
    temperature: 'cool',
    brightness: 45,
    saturation: 62
  }
```

### Final Statistics:
```
📊 BATCH PROCESSING COMPLETE

Total artworks:       234
✅ Successfully processed: 220
⏭️  Skipped (already have colors): 10
⚠️  No image URL: 2
❌ Extraction failed: 1
❌ Update failed: 1
```

## Resume Capability

The script automatically skips artworks that already have color data, so you can:
- **Stop and resume** at any time (Ctrl+C)
- **Re-run safely** without duplicating work
- **Process new artworks** by running again

## Rate Limiting

The script waits **500ms** between each artwork to avoid overwhelming image servers. You can adjust this in the code:

```javascript
// In extractColors.js, line ~180
await new Promise(resolve => setTimeout(resolve, 500)); // Change to 1000 for 1 second
```

## Troubleshooting

### Error: Cannot find module 'serviceAccountKey.json'
**Solution:** Download your Firebase Admin SDK key and place it in project root.

### Error: CORS or image download failed
**Solution:** Some museum servers may block automated downloads. The script will:
- Log the error
- Mark as failed
- Continue with next artwork

### Error: ECONNRESET or network timeout
**Solution:**
- Check your internet connection
- Increase timeout in code
- Re-run script (it will skip completed artworks)

## Performance

- **Speed**: ~2-3 seconds per artwork (download + extraction)
- **For 100 artworks**: ~5-10 minutes
- **For 500 artworks**: ~30-45 minutes
- **Memory usage**: ~100-200 MB

## Firestore Document Structure

After processing, each artwork will have:

```typescript
{
  id: "abc123",
  title: "Water Lilies",
  artist: "Claude Monet",
  // ...existing fields

  colors: {
    dominant: ['#3A5F8A', '#E8C4A0', '#1A2634', '#7A9BB5', '#C4A580'],
    palette: {
      vibrant: '#3A5F8A',
      darkVibrant: '#1A2634',
      lightVibrant: '#7A9BB5',
      muted: '#C4A580',
      darkMuted: '#5A4030',
      lightMuted: '#E8C4A0'
    },
    temperature: 'cool',
    brightness: 45,
    saturation: 62,
    averageColor: '#3A5F8A'
  },
  colorsExtractedAt: Timestamp // When colors were extracted
}
```

## Next Steps

After running this script:

1. ✅ **Remove client-side extraction** (optional)
   - Color data now comes from Firestore
   - Client-side extraction only needed for new artworks

2. ✅ **Enable mood filtering**
   - Colors are pre-computed
   - Fast mood-based queries

3. ✅ **Add to Cloud Function** (optional)
   - Auto-extract colors for new artworks
   - Trigger on artwork creation

## Cloud Function (Future Enhancement)

To automatically extract colors for newly added artworks:

```javascript
// functions/index.js
exports.extractArtworkColors = functions.firestore
  .document('artworks/{artworkId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data.imageUrl || data.colors) return;

    const colors = await extractColorsFromUrl(data.imageUrl);
    return snap.ref.update({ colors });
  });
```

## Security Note

⚠️ **IMPORTANT**: Never commit `serviceAccountKey.json` to git!
- It contains admin credentials
- Can access your entire Firebase project
- Already added to `.gitignore`
