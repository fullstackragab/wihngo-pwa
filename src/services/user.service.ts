import { apiHelper, uploadFile } from "./api-helper";
import { UpdateProfileDto, ProfileResponse } from "@/types/user";

// Get current user's profile
export async function getProfile(): Promise<ProfileResponse> {
  return apiHelper.get<ProfileResponse>("users/me");
}

// Update current user's profile
export async function updateProfile(data: UpdateProfileDto): Promise<ProfileResponse> {
  return apiHelper.patch<ProfileResponse>("users/me", data);
}

// Upload profile image and get S3 key
export async function uploadProfileImage(file: File): Promise<{ s3Key: string; url: string }> {
  return uploadFile<{ s3Key: string; url: string }>("users/me/profile-image", file, "file");
}

// Update profile with new image
export async function updateProfileWithImage(
  file: File,
  profileData?: Omit<UpdateProfileDto, "profileImageS3Key">
): Promise<ProfileResponse> {
  // First upload the image
  const { s3Key } = await uploadProfileImage(file);

  // Then update the profile with the new S3 key
  return updateProfile({
    ...profileData,
    profileImageS3Key: s3Key,
  });
}
