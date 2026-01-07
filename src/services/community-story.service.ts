/**
 * Community Stories Service
 *
 * /// Stories express love. Allocation ignores attention.
 *
 * CRITICAL: Stories must never affect money routing.
 * - No API path to support a bird from a story
 * - No bird associations
 * - No ownership
 * - No metrics
 */

import { apiHelper, publicGet, uploadFile } from "./api-helper";
import {
  CommunityStory,
  CommunityStoryListResponse,
  SubmitCommunityStoryRequest,
  StoryMediaUploadResponse,
} from "@/types/community-story";

/**
 * Get approved community stories (public)
 * Only returns approved stories - no pending/rejected
 */
export async function getCommunityStories(params?: {
  page?: number;
  pageSize?: number;
}): Promise<CommunityStoryListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.pageSize) searchParams.set("pageSize", params.pageSize.toString());

  const query = searchParams.toString();
  return publicGet<CommunityStoryListResponse>(
    `love-videos${query ? `?${query}` : ""}`
  );
}

/**
 * Get a single community story by ID (public)
 */
export async function getCommunityStory(id: string): Promise<CommunityStory> {
  return publicGet<CommunityStory>(`love-videos/${id}`);
}

/**
 * Submit a new community story (requires auth)
 * Story goes to pending status for moderation
 *
 * Moderation rules (server-side enforced):
 * - Reject if video asks for donations
 * - Reject if "my bird" / ownership framing
 * - Reject if urgency ("save this bird now")
 * - Reject if attempts to direct funds to specific bird
 * - Reject if promotional or influencer-driven
 */
export async function submitCommunityStory(
  data: SubmitCommunityStoryRequest
): Promise<{ id: string; status: "pending" }> {
  return apiHelper.post<{ id: string; status: "pending" }>(
    "love-videos",
    data
  );
}

/**
 * Upload media for a community story (requires auth)
 * Returns a mediaKey to include in the story submission
 */
export async function uploadStoryMedia(
  file: File
): Promise<StoryMediaUploadResponse> {
  return uploadFile<StoryMediaUploadResponse>(
    "love-videos/upload-media",
    file,
    "file"
  );
}

/**
 * EXPLICITLY NOT IMPLEMENTED:
 * - No update/delete by submitter after submission
 * - No ownership-based permissions
 * - No like/unlike
 * - No comments
 * - No share counts
 * - No view counts
 * - No getBirdStories (stories are NOT attached to birds)
 * - No getUserStories (stories are NOT owned)
 */
