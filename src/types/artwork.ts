export interface Artwork {
  id: string;
  title: string;
  artist: string;
  date: string;
  imageUrl: string;
  imageUrlSmall?: string; // Low-res version for progressive loading
  description?: string;
  museum: 'artic' | 'met' | 'wikiart';
  creditLine?: string;
  department?: string;
  aspectRatio?: number; // width / height (>1 = landscape, <1 = portrait, ~1 = square)
  orientation?: 'landscape' | 'portrait'; // Matches getDeviceOrientation
}

export interface ArtworkApiResponse {
  data: unknown;
  config?: unknown;
}
