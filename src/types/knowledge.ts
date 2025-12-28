/**
 * Knowledge Hub Types
 *
 * Structure-first approach: accuracy over speed.
 * Content will be carefully prepared and reviewed.
 */

export type GuideCategory =
  | "feeding"
  | "shelter"
  | "seasonal"
  | "urban"
  | "health"
  | "safety";

export type Guide = {
  slug: string;
  title: string;
  category: GuideCategory;
  summary: string;
  content?: string; // markdown - optional until content is ready
  readingTime?: number;
  isReady: boolean; // false = show "being prepared" state
  updatedAt?: string;
};

export type Species = {
  slug: string;
  commonName: string;
  scientificName?: string;
  imageUrl?: string;
  description?: string;
  diet?: string;
  habitat?: string;
  risks?: string[];
  careTips?: string[];
  isReady: boolean; // false = show "being prepared" state
};

export type GuideCategories = {
  [key in GuideCategory]: {
    title: string;
    description: string;
    icon: string;
  };
};
