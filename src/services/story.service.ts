import { apiHelper } from "./api-helper";
import {
  Story,
  StoryDetailDto,
  CreateStoryDto,
  UpdateStoryDto,
  StoryListResponse,
  StoryComment,
} from "@/types/story";

export async function getStories(page = 1, pageSize = 20): Promise<StoryListResponse> {
  return apiHelper.get<StoryListResponse>(`stories?page=${page}&pageSize=${pageSize}`);
}

export async function getStory(storyId: string): Promise<StoryDetailDto> {
  return apiHelper.get<StoryDetailDto>(`stories/${storyId}`);
}

export async function createStory(data: CreateStoryDto): Promise<Story> {
  return apiHelper.post<Story>("stories", data);
}

export async function updateStory(storyId: string, data: UpdateStoryDto): Promise<Story> {
  return apiHelper.put<Story>(`stories/${storyId}`, data);
}

export async function deleteStory(storyId: string): Promise<void> {
  return apiHelper.delete(`stories/${storyId}`);
}

export async function likeStory(storyId: string): Promise<void> {
  return apiHelper.post(`stories/${storyId}/like`, {});
}

export async function unlikeStory(storyId: string): Promise<void> {
  return apiHelper.delete(`stories/${storyId}/like`);
}

export async function getStoryComments(storyId: string): Promise<StoryComment[]> {
  return apiHelper.get<StoryComment[]>(`stories/${storyId}/comments`);
}

export async function addComment(storyId: string, content: string): Promise<StoryComment> {
  return apiHelper.post<StoryComment>(`stories/${storyId}/comments`, { content });
}

export async function deleteComment(storyId: string, commentId: string): Promise<void> {
  return apiHelper.delete(`stories/${storyId}/comments/${commentId}`);
}

export async function getBirdStories(birdId: string, page = 1): Promise<StoryListResponse> {
  return apiHelper.get<StoryListResponse>(`birds/${birdId}/stories?page=${page}`);
}

export async function getUserStories(userId: string, page = 1): Promise<StoryListResponse> {
  return apiHelper.get<StoryListResponse>(`users/${userId}/stories?page=${page}`);
}
