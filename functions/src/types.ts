// Artwork type stored in Firestore
export interface Artwork {
  id: string;
  title: string;
  artist: string;
  date: string;
  imageUrl: string;
  imageUrlSmall?: string;
  description?: string;
  museum: 'artic' | 'met' | 'wikiart';
  creditLine?: string;
  department?: string;
  aspectRatio?: number; // width / height (>1 = landscape, <1 = portrait, ~1 = square)
  orientation?: 'landscape' | 'portrait'; // Matches frontend getDeviceOrientation
  createdAt: number; // Timestamp when added to Firestore
  updatedAt: number; // Timestamp when last updated
}

// WikiArt API types
export interface WikiArtSession {
  SessionKey: string;
}

export interface WikiArtPainting {
  id: string;
  title: string;
  artistName: string;
  completitionYear: number;
  image: string;
  width: number;
  height: number;
  contentId: number;
}

export interface WikiArtPaintingsResponse {
  data: WikiArtPainting[];
  paginationToken: string;
  hasMore: boolean;
}

// ARTIC API types
export interface ArticArtwork {
  id: number;
  title: string;
  artist_display: string;
  date_display: string;
  image_id: string;
  description?: string;
  credit_line?: string;
  department_title?: string;
}

export interface ArticResponse {
  data: ArticArtwork;
}

// Met Museum API types
export interface MetArtwork {
  objectID: number;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  primaryImage: string;
  primaryImageSmall: string;
  department?: string;
  creditLine?: string;
}
