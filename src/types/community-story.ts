/**
 * Community Stories - Love Videos Feature
 *
 * CORE PHILOSOPHY:
 * - Stories express love and dignity for birds
 * - Stories are NOT knowledge, NOT fundraising targets, NOT owned
 * - Birds must NEVER compete
 * - Money must ALWAYS flow through pooled, minimum-first support
 *
 * /// Stories express love. Allocation ignores attention.
 *
 * EXPLICIT EXCLUSIONS (system invariants):
 * - NO birdId - stories cannot be attached to birds
 * - NO ownerUserId - stories are non-ownable
 * - NO metrics (views, likes, shares, comments)
 * - NO popularity signals
 * - NO title - stories are just content (YouTube, media, or description)
 * - NO category - all stories are treated equally
 */

export type CommunityStoryStatus = "pending" | "approved" | "rejected";

/**
 * Community Story - Love video (YouTube or uploaded media)
 *
 * MUST NOT contain:
 * - birdId
 * - ownerUserId
 * - donation totals
 * - metrics (views, likes, shares)
 */
export interface CommunityStory {
  id: string;
  youtubeUrl?: string;
  description?: string;
  status: CommunityStoryStatus;
  createdAt: string;
  approvedAt?: string;
  /** YouTube video thumbnail (auto-generated from video ID) */
  thumbnailUrl?: string;
  /** Uploaded media URL (if not YouTube) */
  mediaUrl?: string;
  /** Type of uploaded media */
  mediaType?: "image" | "video";
}

/**
 * Submit a new community story
 * At least one of youtubeUrl, description, or mediaKey must be provided
 */
export interface SubmitCommunityStoryRequest {
  youtubeUrl?: string;
  description?: string;
  mediaKey?: string;
}

/**
 * Response from media upload
 */
export interface StoryMediaUploadResponse {
  mediaKey: string;
  url: string;
  mediaType: "image" | "video";
}

/**
 * List response for community stories
 */
export interface CommunityStoryListResponse {
  items: CommunityStory[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Get YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Get YouTube embed URL from video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
