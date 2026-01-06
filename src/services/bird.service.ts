import { apiHelper, publicGet, uploadFile } from "./api-helper";
import { Bird, CreateBirdDto, UpdateBirdDto, UpdateBirdVisibilityDto, UpdateBirdVisibilityResponse, UpdateBirdNeedsSupportDto, UpdateBirdNeedsSupportResponse, BirdsNeedsSupportResponse, CanSupportBirdResponse, Memorial, MemorialMessage, CreateMemorialMessageDto } from "@/types/bird";

interface BirdListResponse {
  items: Bird[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// Public endpoints - no auth required
export async function getBirds(page = 1, pageSize = 20): Promise<BirdListResponse> {
  return publicGet<BirdListResponse>(`birds?page=${page}&pageSize=${pageSize}`);
}

export async function getBird(birdId: string): Promise<Bird> {
  return publicGet<Bird>(`birds/${birdId}`);
}

export async function createBird(data: CreateBirdDto): Promise<Bird> {
  return apiHelper.post<Bird>("birds", data);
}

export async function updateBird(birdId: string, data: UpdateBirdDto): Promise<Bird> {
  return apiHelper.put<Bird>(`birds/${birdId}`, data);
}

export async function updateBirdSupportSettings(birdId: string, supportEnabled: boolean): Promise<void> {
  return apiHelper.patch(`birds/${birdId}/support-settings`, { supportEnabled });
}

// Update bird visibility (hide/show from public listings)
export async function updateBirdVisibility(birdId: string, data: UpdateBirdVisibilityDto): Promise<UpdateBirdVisibilityResponse> {
  return apiHelper.patch<UpdateBirdVisibilityResponse>(`birds/${birdId}/visibility`, data);
}

// Update bird needs-support status
export async function updateBirdNeedsSupport(birdId: string, data: UpdateBirdNeedsSupportDto): Promise<UpdateBirdNeedsSupportResponse> {
  return apiHelper.patch<UpdateBirdNeedsSupportResponse>(`needs-support/birds/${birdId}`, data);
}

// Get birds that need support (once per week)
export async function getBirdsNeedingSupport(): Promise<BirdsNeedsSupportResponse> {
  return publicGet<BirdsNeedsSupportResponse>(`needs-support/birds`);
}

// Check if a bird can receive support in the current round
export async function canSupportBird(birdId: string): Promise<CanSupportBirdResponse> {
  return publicGet<CanSupportBirdResponse>(`needs-support/birds/${birdId}/can-support`);
}

export async function deleteBird(birdId: string): Promise<void> {
  return apiHelper.delete(`birds/${birdId}`);
}

export async function loveBird(birdId: string): Promise<void> {
  return apiHelper.post(`birds/${birdId}/love`, {});
}

export async function unloveBird(birdId: string): Promise<void> {
  return apiHelper.delete(`birds/${birdId}/love`);
}

export async function searchBirds(query: string): Promise<Bird[]> {
  const response = await publicGet<BirdListResponse>(`birds/search?q=${encodeURIComponent(query)}`);
  return response.items;
}

// Note: getFeaturedBirds removed - "All birds are equal" principle
// Birds are ordered by recent activity, not featured status

// Get current user's birds (birds they own/care for)
export async function getMyBirds(): Promise<Bird[]> {
  const response = await apiHelper.get<BirdListResponse>("users/me/birds");
  return response.items;
}

// Get current user's loved birds
export async function getMyLovedBirds(): Promise<Bird[]> {
  const response = await apiHelper.get<BirdListResponse>("users/me/loved-birds");
  return response.items;
}

// Get current user's supported birds
export async function getMySupportedBirds(): Promise<Bird[]> {
  const response = await apiHelper.get<BirdListResponse>("users/me/supported-birds");
  return response.items;
}

// Legacy functions for viewing other users' public birds (if needed)
export async function getUserBirds(userId: string): Promise<Bird[]> {
  const response = await apiHelper.get<BirdListResponse>(`users/${userId}/birds`);
  return response.items;
}

export async function getLovedBirds(userId: string): Promise<Bird[]> {
  const response = await apiHelper.get<BirdListResponse>(`users/${userId}/loved-birds`);
  return response.items;
}

export async function getSupportedBirds(userId: string): Promise<Bird[]> {
  const response = await apiHelper.get<BirdListResponse>(`users/${userId}/supported-birds`);
  return response.items;
}

// Memorial endpoints
export async function markAsMemorial(birdId: string): Promise<Bird> {
  return apiHelper.post<Bird>(`birds/${birdId}/memorial`, {});
}

export async function getMemorial(birdId: string): Promise<Memorial> {
  return publicGet<Memorial>(`birds/${birdId}/memorial`);
}

export async function getMemorialMessages(birdId: string): Promise<MemorialMessage[]> {
  return publicGet<MemorialMessage[]>(`birds/${birdId}/memorial/messages`);
}

export async function postMemorialMessage(birdId: string, data: CreateMemorialMessageDto): Promise<MemorialMessage> {
  return apiHelper.post<MemorialMessage>(`birds/${birdId}/memorial/messages`, data);
}

// Image upload response
export interface BirdImageUploadResponse {
  s3Key: string;
  url: string;
}

// Pre-upload image before creating bird (returns S3 key to include in create request)
export async function preUploadBirdImage(file: File): Promise<BirdImageUploadResponse> {
  return uploadFile<BirdImageUploadResponse>("birds/upload-image", file, "file");
}

// Upload/update image for existing bird
export async function uploadBirdImage(birdId: string, file: File): Promise<BirdImageUploadResponse> {
  return uploadFile<BirdImageUploadResponse>(`birds/${birdId}/image`, file, "file");
}
