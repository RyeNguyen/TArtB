/**
 * Color Analysis Utilities
 * Extracts color palettes, mood characteristics, and visual properties from images
 */

export interface ColorPalette {
  vibrant?: string;
  darkVibrant?: string;
  lightVibrant?: string;
  muted?: string;
  darkMuted?: string;
  lightMuted?: string;
}

export interface ColorAnalysis {
  dominant: string[];           // Top 5 dominant colors
  palette: ColorPalette;        // Categorized color palette
  temperature: 'warm' | 'cool' | 'neutral';
  brightness: number;           // 0-100
  saturation: number;           // 0-100
  averageColor: string;         // Overall tone
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Extracts color analysis from an image element
 */
export const extractImageColors = (
  imageElement: HTMLImageElement,
  sampleSize: number = 10
): ColorAnalysis | null => {
  try {
    // Create temporary canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return null;

    // Scale down for performance (max 200x200)
    const maxSize = 200;
    const scale = Math.min(maxSize / imageElement.width, maxSize / imageElement.height, 1);
    canvas.width = imageElement.width * scale;
    canvas.height = imageElement.height * scale;

    // Draw image
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Sample pixels (every nth pixel for performance)
    const colorCounts = new Map<string, { rgb: RGB; count: number }>();
    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;

    for (let i = 0; i < pixels.length; i += 4 * sampleSize) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // Skip transparent pixels
      if (a < 128) continue;

      // Quantize colors (group similar colors)
      const quantizedR = Math.round(r / 32) * 32;
      const quantizedG = Math.round(g / 32) * 32;
      const quantizedB = Math.round(b / 32) * 32;
      const key = `${quantizedR},${quantizedG},${quantizedB}`;

      // Count color frequency
      const existing = colorCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorCounts.set(key, { rgb: { r: quantizedR, g: quantizedG, b: quantizedB }, count: 1 });
      }

      // Calculate average
      totalR += r;
      totalG += g;
      totalB += b;
      pixelCount++;
    }

    if (pixelCount === 0) return null;

    // Get dominant colors (top 5)
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10); // Take top 10 for palette categorization

    const dominant = sortedColors.slice(0, 5).map(([, { rgb }]) => rgbToHex(rgb));

    // Calculate average color
    const avgR = Math.round(totalR / pixelCount);
    const avgG = Math.round(totalG / pixelCount);
    const avgB = Math.round(totalB / pixelCount);
    const averageColor = rgbToHex({ r: avgR, g: avgG, b: avgB });

    // Calculate overall properties from average color
    const avgHsl = rgbToHsl({ r: avgR, g: avgG, b: avgB });
    const brightness = Math.round(avgHsl.l);
    const saturation = Math.round(avgHsl.s);
    const temperature = getColorTemperature(avgHsl.h);

    // Categorize colors into palette
    const palette = categorizeColors(sortedColors.map(([, { rgb }]) => rgb));

    return {
      dominant,
      palette,
      temperature,
      brightness,
      saturation,
      averageColor,
    };
  } catch (error) {
    console.error('Error extracting colors:', error);
    return null;
  }
};

/**
 * Categorize colors into vibrant, muted, dark, and light variants
 */
const categorizeColors = (colors: RGB[]): ColorPalette => {
  const palette: ColorPalette = {};

  let maxSatVibrant = 0;
  let maxSatMuted = 0;
  let darkestVibrant: RGB | null = null;
  let lightestVibrant: RGB | null = null;
  let darkestMuted: RGB | null = null;
  let lightestMuted: RGB | null = null;

  for (const rgb of colors) {
    const hsl = rgbToHsl(rgb);

    // Vibrant colors (high saturation)
    if (hsl.s > 40) {
      if (hsl.s > maxSatVibrant) {
        maxSatVibrant = hsl.s;
        palette.vibrant = rgbToHex(rgb);
      }
      if (!darkestVibrant || hsl.l < rgbToHsl(darkestVibrant).l) {
        darkestVibrant = rgb;
      }
      if (!lightestVibrant || hsl.l > rgbToHsl(lightestVibrant).l) {
        lightestVibrant = rgb;
      }
    }
    // Muted colors (low saturation)
    else {
      if (hsl.s > maxSatMuted) {
        maxSatMuted = hsl.s;
        palette.muted = rgbToHex(rgb);
      }
      if (!darkestMuted || hsl.l < rgbToHsl(darkestMuted).l) {
        darkestMuted = rgb;
      }
      if (!lightestMuted || hsl.l > rgbToHsl(lightestMuted).l) {
        lightestMuted = rgb;
      }
    }
  }

  if (darkestVibrant) palette.darkVibrant = rgbToHex(darkestVibrant);
  if (lightestVibrant) palette.lightVibrant = rgbToHex(lightestVibrant);
  if (darkestMuted) palette.darkMuted = rgbToHex(darkestMuted);
  if (lightestMuted) palette.lightMuted = rgbToHex(lightestMuted);

  return palette;
};

/**
 * Determine color temperature based on hue
 */
const getColorTemperature = (hue: number): 'warm' | 'cool' | 'neutral' => {
  // Warm: Red (0-60), Orange, Yellow
  // Cool: Green (120-240), Blue, Purple
  // Neutral: Near edges or desaturated

  if ((hue >= 0 && hue < 60) || (hue >= 330 && hue <= 360)) {
    return 'warm'; // Red, Orange, Yellow
  } else if (hue >= 120 && hue < 300) {
    return 'cool'; // Green, Blue, Purple
  } else {
    return 'neutral'; // Yellow-green or Purple-red
  }
};

/**
 * Convert RGB to Hex
 */
const rgbToHex = ({ r, g, b }: RGB): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Convert RGB to HSL
 */
const rgbToHsl = ({ r, g, b }: RGB): HSL => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

/**
 * Mood matching based on color characteristics
 */
export interface MoodProfile {
  temperature?: 'warm' | 'cool' | 'neutral';
  brightnessRange?: [number, number];
  saturationRange?: [number, number];
  dominantHues?: string[];
}

export const MOOD_PROFILES: Record<string, MoodProfile> = {
  // Weather & Nature
  rainy: {
    temperature: 'cool',
    brightnessRange: [20, 60],
    saturationRange: [15, 50],
  },
  sunny: {
    temperature: 'warm',
    brightnessRange: [60, 100],
    saturationRange: [50, 100],
  },
  foggy: {
    temperature: 'cool',
    brightnessRange: [40, 70],
    saturationRange: [10, 35],
  },
  stormy: {
    temperature: 'cool',
    brightnessRange: [10, 45],
    saturationRange: [20, 60],
  },
  spring: {
    temperature: 'warm',
    brightnessRange: [55, 85],
    saturationRange: [40, 80],
  },
  autumn: {
    temperature: 'warm',
    brightnessRange: [35, 65],
    saturationRange: [50, 85],
  },
  winter: {
    temperature: 'cool',
    brightnessRange: [60, 95],
    saturationRange: [5, 30],
  },
  twilight: {
    brightnessRange: [25, 55],
    saturationRange: [40, 75],
  },
  moonlight: {
    temperature: 'cool',
    brightnessRange: [20, 50],
    saturationRange: [15, 45],
  },

  // Emotional
  joyful: {
    temperature: 'warm',
    brightnessRange: [65, 95],
    saturationRange: [60, 100],
  },
  melancholic: {
    temperature: 'cool',
    brightnessRange: [15, 50],
    saturationRange: [10, 40],
  },
  nostalgic: {
    temperature: 'warm',
    brightnessRange: [40, 70],
    saturationRange: [30, 60],
  },
  mysterious: {
    brightnessRange: [10, 40],
    saturationRange: [30, 70],
  },
  romantic: {
    temperature: 'warm',
    brightnessRange: [45, 75],
    saturationRange: [40, 80],
  },
  contemplative: {
    brightnessRange: [30, 60],
    saturationRange: [20, 50],
  },
  serene: {
    temperature: 'cool',
    brightnessRange: [50, 80],
    saturationRange: [15, 45],
  },

  // Energy & Intensity
  energetic: {
    saturationRange: [60, 100],
    brightnessRange: [50, 90],
  },
  calm: {
    brightnessRange: [40, 75],
    saturationRange: [15, 50],
  },
  peaceful: {
    temperature: 'cool',
    brightnessRange: [50, 80],
    saturationRange: [20, 60],
  },
  vibrant: {
    saturationRange: [70, 100],
    brightnessRange: [55, 85],
  },
  intense: {
    saturationRange: [65, 100],
    brightnessRange: [40, 70],
  },
  gentle: {
    brightnessRange: [55, 85],
    saturationRange: [20, 50],
  },
  powerful: {
    saturationRange: [60, 100],
    brightnessRange: [25, 60],
  },

  // Aesthetic & Atmosphere
  dramatic: {
    brightnessRange: [10, 40],
    saturationRange: [40, 100],
  },
  dreamy: {
    brightnessRange: [60, 90],
    saturationRange: [30, 70],
  },
  ethereal: {
    brightnessRange: [70, 95],
    saturationRange: [20, 50],
  },
  vintage: {
    temperature: 'warm',
    brightnessRange: [35, 65],
    saturationRange: [30, 60],
  },
  modern: {
    brightnessRange: [50, 85],
    saturationRange: [40, 90],
  },
  earthy: {
    temperature: 'warm',
    brightnessRange: [30, 60],
    saturationRange: [35, 70],
  },
  cosmic: {
    temperature: 'cool',
    brightnessRange: [15, 50],
    saturationRange: [50, 90],
  },
  minimalist: {
    brightnessRange: [60, 95],
    saturationRange: [5, 25],
  },
  elegant: {
    brightnessRange: [40, 75],
    saturationRange: [25, 60],
  },
  rustic: {
    temperature: 'warm',
    brightnessRange: [30, 60],
    saturationRange: [40, 75],
  },
  somber: {
    brightnessRange: [15, 45],
    saturationRange: [15, 45],
  },
};

/**
 * Calculate match score between artwork colors and mood (0-100)
 */
export const calculateMoodMatch = (
  colors: ColorAnalysis,
  mood: string
): number => {
  const profile = MOOD_PROFILES[mood];
  if (!profile) return 0;

  let score = 0;

  // Temperature match (40 points max)
  if (profile.temperature) {
    if (colors.temperature === profile.temperature) {
      score += 40; // Perfect temperature match
    } else if (colors.temperature === 'neutral') {
      score += 20; // Neutral is half-match
    }
  } else {
    // If no temperature specified, give 40 points (neutral)
    score += 40;
  }

  // Brightness match (30 points max)
  if (profile.brightnessRange) {
    const [minB, maxB] = profile.brightnessRange;
    if (colors.brightness >= minB && colors.brightness <= maxB) {
      score += 30; // Perfect brightness match
    } else {
      // Partial score based on how close it is
      const distance = Math.min(
        Math.abs(colors.brightness - minB),
        Math.abs(colors.brightness - maxB)
      );
      score += Math.max(0, 30 - distance * 0.5); // Lose 0.5 points per unit distance
    }
  } else {
    // If no brightness specified, give 30 points (neutral)
    score += 30;
  }

  // Saturation match (30 points max)
  if (profile.saturationRange) {
    const [minS, maxS] = profile.saturationRange;
    if (colors.saturation >= minS && colors.saturation <= maxS) {
      score += 30; // Perfect saturation match
    } else {
      // Partial score based on how close it is
      const distance = Math.min(
        Math.abs(colors.saturation - minS),
        Math.abs(colors.saturation - maxS)
      );
      score += Math.max(0, 30 - distance * 0.5); // Lose 0.5 points per unit distance
    }
  } else {
    // If no saturation specified, give 30 points (neutral)
    score += 30;
  }

  return Math.round(Math.min(100, score)); // Cap at 100
};
