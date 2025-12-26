import { apiHelper } from "./api-helper";
import { Bird, CreateBirdDto, UpdateBirdDto } from "@/types/bird";

interface BirdListResponse {
  items: Bird[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export async function getBirds(page = 1, pageSize = 20): Promise<BirdListResponse> {
  return apiHelper.get<BirdListResponse>(`birds?page=${page}&pageSize=${pageSize}`);
}

export async function getBird(birdId: string): Promise<Bird> {
  return apiHelper.get<Bird>(`birds/${birdId}`);
}

export async function createBird(data: CreateBirdDto): Promise<Bird> {
  return apiHelper.post<Bird>("birds", data);
}

export async function updateBird(birdId: string, data: UpdateBirdDto): Promise<Bird> {
  return apiHelper.put<Bird>(`birds/${birdId}`, data);
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
  const response = await apiHelper.get<BirdListResponse>(`birds/search?q=${encodeURIComponent(query)}`);
  return response.items;
}

export async function getFeaturedBirds(): Promise<Bird[]> {
  const response = await apiHelper.get<BirdListResponse>("birds?featured=true&pageSize=5");
  return response.items ?? [];
}

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
