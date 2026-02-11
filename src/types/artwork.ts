import { ColorAnalysis } from "@utils/colorUtils";

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  date: string;
  imageUrl: string;
  imageUrlSmall?: string;
  description?: string;
  museum: "artic" | "met" | "wikiart";
  creditLine?: string;
  department?: string;
  aspectRatio?: number;
  orientation?: "landscape" | "portrait";
  colors?: ColorAnalysis;
  moods?: string[];
  tags?: string[];
  period?: string;
}

export interface ArtworkApiResponse {
  data: unknown;
  config?: unknown;
}
