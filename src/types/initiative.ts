/**
 * Initiative Types
 *
 * Initiatives are real-world projects for bird welfare.
 * Currently read-only. Community proposals in Phase 2.
 */

export type InitiativeStatus = "example" | "active" | "completed" | "paused";

export type FAQItem = {
  question: string;
  answer: string;
};

export type Initiative = {
  slug: string;
  title: string;
  titleAr?: string; // Arabic title
  tagline: string;
  taglineAr?: string; // Arabic tagline
  status: InitiativeStatus;
  description: string;
  descriptionAr?: string;
  problem: string;
  problemAr?: string;
  goals: string[];
  goalsAr?: string[];
  progress?: number; // 0-100, for active initiatives
  outcomes?: string[]; // for completed initiatives
  lessonsLearned?: string; // for completed initiatives
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  isExample: boolean; // true = clearly labeled as example
  faq?: FAQItem[]; // FAQ items
  faqAr?: FAQItem[]; // Arabic FAQ items
  conclusion?: string; // Closing statement
  conclusionAr?: string;
};
