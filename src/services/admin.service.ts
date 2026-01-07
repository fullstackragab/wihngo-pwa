/**
 * Admin Service - Story Moderation
 *
 * Endpoints:
 * - GET /love-videos/pending - List pending stories
 * - GET /love-videos/moderation/{id} - Get story for review
 * - POST /love-videos/{id}/approve - Approve story
 * - POST /love-videos/{id}/reject - Reject story
 * - POST /love-videos/{id}/hide - Hide approved story
 */

import { apiHelper } from "./api-helper";

/**
 * Story item from pending list
 */
export interface AdminStoryListItem {
  id: string;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  submittedByUserId: string;
  createdAt: string;
  rejectionReason: string | null;
}

/**
 * Full story details for moderation
 */
export interface AdminStoryDetail {
  id: string;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  submittedByUserId: string;
  createdAt: string;
  rejectionReason: string | null;
}

/**
 * Response from moderation actions
 */
export interface ModerationResponse {
  success: boolean;
  loveVideoId: string;
  newStatus: string;
  message: string | null;
  errorCode?: string | null;
}

/**
 * Get all pending stories for moderation
 */
export async function getPendingStories(): Promise<AdminStoryListItem[]> {
  return apiHelper.get<AdminStoryListItem[]>("love-videos/pending");
}

/**
 * Get story details for moderation review
 */
export async function getStoryForModeration(id: string): Promise<AdminStoryDetail> {
  return apiHelper.get<AdminStoryDetail>(`love-videos/moderation/${id}`);
}

/**
 * Approve a pending story
 */
export async function approveStory(
  id: string,
  description?: string
): Promise<ModerationResponse> {
  return apiHelper.post<ModerationResponse>(`love-videos/${id}/approve`, {
    description,
  });
}

/**
 * Reject a pending story
 */
export async function rejectStory(
  id: string,
  reason: string
): Promise<ModerationResponse> {
  return apiHelper.post<ModerationResponse>(`love-videos/${id}/reject`, {
    reason,
  });
}

/**
 * Hide an approved story
 */
export async function hideStory(
  id: string,
  reason: string
): Promise<ModerationResponse> {
  return apiHelper.post<ModerationResponse>(`love-videos/${id}/hide`, {
    reason,
  });
}
