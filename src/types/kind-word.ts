/**
 * Kind Words (Messages of Care) - Comment System Types
 *
 * Naming: Always use "Kind Words" or "Messages of Care" in UI, never "comments"
 */

export type KindWord = {
  id: string;
  birdId: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: string;
  isVisible: boolean;
};

export type KindWordsSettings = {
  birdId: string;
  isEnabled: boolean;
  blockedUserIds: string[];
};

export type CreateKindWordDto = {
  birdId: string;
  text: string;
};

export type KindWordsListResponse = {
  items: KindWord[];
  canPost: boolean;
  isEnabled: boolean;
  remainingToday: number;
};

// Validation constants
export const KIND_WORD_MAX_LENGTH = 200;
export const KIND_WORD_MAX_PER_DAY = 3;

// Validation helper
export function validateKindWordText(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();

  if (!trimmed) {
    return { valid: false, error: "Please write something kind." };
  }

  if (trimmed.length > KIND_WORD_MAX_LENGTH) {
    return { valid: false, error: `Please keep messages kind and under ${KIND_WORD_MAX_LENGTH} characters.` };
  }

  // Check for URLs
  const urlPattern = /(https?:\/\/|www\.)[^\s]+/i;
  if (urlPattern.test(trimmed)) {
    return { valid: false, error: "Please share kind words only, without links." };
  }

  // Check for emoji-only messages (at least some letters required)
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  if (!hasLetters) {
    return { valid: false, error: "Please include some words with your message." };
  }

  // Check for mentions
  if (trimmed.includes("@")) {
    return { valid: false, error: "Please share kind words without mentions." };
  }

  return { valid: true };
}
