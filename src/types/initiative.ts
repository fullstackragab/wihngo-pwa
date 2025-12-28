/**
 * Initiative Types
 *
 * Initiatives are real-world projects for bird welfare.
 * Currently read-only. Community proposals in Phase 2.
 */

export type InitiativeStatus = "example" | "active" | "completed" | "paused";

export type Initiative = {
  slug: string;
  title: string;
  tagline: string;
  status: InitiativeStatus;
  description: string;
  problem: string;
  goals: string[];
  progress?: number; // 0-100, for active initiatives
  outcomes?: string[]; // for completed initiatives
  lessonsLearned?: string; // for completed initiatives
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  isExample: boolean; // true = clearly labeled as example
};
