/**
 * Generate a smaller version of an artwork image URL
 * Supports WikiArt, Art Institute of Chicago, and Met Museum formats
 */
export const generateSmallImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;

  // WikiArt: Replace size suffix (!HD.jpg, !Large.jpg, etc.)
  // Example: https://uploads0.wikiart.org/.../painting!HD.jpg → ...!PinterestSmall.jpg
  if (imageUrl.includes('wikiart.org')) {
    return imageUrl.replace(/!(HD|Large|Medium|Small)\.jpg$/i, '!PinterestSmall.jpg');
  }

  // Art Institute of Chicago (ARTIC): Change resolution in IIIF URL
  // Example: .../full/843,/0/default.jpg → .../full/200,/0/default.jpg
  if (imageUrl.includes('artic.edu')) {
    return imageUrl.replace(/\/full\/\d+,\//, '/full/200,/');
  }

  // Met Museum: URLs are direct, no size parameter
  // If it's a large image URL, try to guess the small version
  if (imageUrl.includes('metmuseum.org')) {
    // Met provides both primaryImage and primaryImageSmall
    // If we have the large one, we can't easily generate small
    // But we can try replacing 'original' with 'web-large' or similar
    // For now, return as-is since Met API should provide both
    return imageUrl;
  }

  // Unknown format, return original
  return imageUrl;
};

/**
 * Generate a medium-sized version of an artwork image URL
 * Useful as a middle step in progressive loading
 */
export const generateMediumImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;

  // WikiArt: Use 'Large' format (~750x600)
  if (imageUrl.includes('wikiart.org')) {
    return imageUrl.replace(/!(HD|PinterestSmall|Medium|Small|Large)\.jpg$/i, '!Large.jpg');
  }

  // Art Institute: Use 400px width
  if (imageUrl.includes('artic.edu')) {
    return imageUrl.replace(/\/full\/\d+,\//, '/full/400,/');
  }

  // Met Museum: Return original (they provide fixed sizes)
  return imageUrl;
};

/**
 * Check if an image URL is already a small version
 */
export const isSmallImageUrl = (imageUrl: string): boolean => {
  if (!imageUrl) return false;

  // WikiArt: Check for small suffixes
  if (imageUrl.includes('wikiart.org')) {
    return /!(PinterestSmall|Small)\.jpg$/i.test(imageUrl);
  }

  // Art Institute: Check for small width (< 300px)
  if (imageUrl.includes('artic.edu')) {
    const match = imageUrl.match(/\/full\/(\d+),\//);
    if (match) {
      const width = parseInt(match[1], 10);
      return width < 300;
    }
  }

  // Unknown, assume not small
  return false;
};

/**
 * Get the optimal size for progressive loading based on screen size
 */
export const getOptimalImageSize = (): 'small' | 'medium' | 'large' => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const screenSize = Math.max(width, height);

  if (screenSize <= 768) {
    return 'small'; // Mobile
  } else if (screenSize <= 1440) {
    return 'medium'; // Tablet/small desktop
  } else {
    return 'large'; // Large desktop/4K
  }
};
