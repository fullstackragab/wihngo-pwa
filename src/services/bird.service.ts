import { apiHelper, publicGet } from "./api-helper";
import { Bird, CreateBirdDto, UpdateBirdDto } from "@/types/bird";

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
