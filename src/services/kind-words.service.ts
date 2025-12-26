/**
 * Kind Words Service
 *
 * API layer for the Kind Words (Messages of Care) feature.
 * Always use "Kind Words" in UI, never "comments".
 */

import { apiHelper } from "./api-helper";
import {
  KindWord,
  KindWordsSettings,
  CreateKindWordDto,
  KindWordsListResponse,
  validateKindWordText,
} from "@/types/kind-word";

/**
 * Get kind words for a bird
 * Returns list of visible kind words, user's posting eligibility, and remaining posts today
 */
export async function getKindWords(birdId: string): Promise<KindWordsListResponse> {
  return apiHelper.get<KindWordsListResponse>(`birds/${birdId}/kind-words`);
}

/**
 * Post a new kind word
 * Validates text before sending to server
 */
export async function postKindWord(data: CreateKindWordDto): Promise<KindWord> {
  // Client-side validation
  const validation = validateKindWordText(data.text);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return apiHelper.post<KindWord>(`birds/${data.birdId}/kind-words`, {
    text: data.text.trim(),
  });
}

/**
 * Delete a kind word (owner or author only)
 * Performs soft delete on the server
 */
export async function deleteKindWord(birdId: string, kindWordId: string): Promise<void> {
  return apiHelper.delete(`birds/${birdId}/kind-words/${kindWordId}`);
}

/**
 * Get kind words settings for a bird (owner only)
 */
export async function getKindWordsSettings(birdId: string): Promise<KindWordsSettings> {
  return apiHelper.get<KindWordsSettings>(`birds/${birdId}/kind-words/settings`);
}

/**
 * Update kind words settings for a bird (owner only)
 */
export async function updateKindWordsSettings(
  birdId: string,
  settings: Partial<KindWordsSettings>
): Promise<KindWordsSettings> {
  return apiHelper.put<KindWordsSettings>(`birds/${birdId}/kind-words/settings`, settings);
}

/**
 * Toggle kind words enabled/disabled (owner only)
 */
export async function toggleKindWords(birdId: string, isEnabled: boolean): Promise<KindWordsSettings> {
  return updateKindWordsSettings(birdId, { isEnabled });
}

/**
 * Block a user from posting kind words on a bird (owner only)
 * No public indication is given to the blocked user
 */
export async function blockUserFromKindWords(birdId: string, userId: string): Promise<void> {
  return apiHelper.post(`birds/${birdId}/kind-words/block/${userId}`, {});
}

/**
 * Unblock a user from posting kind words on a bird (owner only)
 */
export async function unblockUserFromKindWords(birdId: string, userId: string): Promise<void> {
  return apiHelper.delete(`birds/${birdId}/kind-words/block/${userId}`);
}
