export type User = {
  userId: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  profileImageS3Key?: string;
  location?: string;
  isOwner?: boolean;
};

export type UserProfile = User & {
  lovedBirds: string[];
  supportedBirds: string[];
  ownedBirds: string[];
  storiesCount: number;
  totalSupport: number;
};

export type UserCreateDto = {
  name: string;
  email: string;
  password: string;
  profileImage?: string;
  bio?: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type AuthResponseDto = {
  token: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  name: string;
  email: string;
  emailConfirmed: boolean;
  profileImageUrl?: string;
  profileImageS3Key?: string;
};

export type UpdateUserDto = {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
};

export type UpdateProfileDto = {
  name?: string;
  bio?: string;
  profileImageS3Key?: string;
};

export type ProfileResponse = {
  userId: string;
  name: string;
  email: string;
  profileImageS3Key?: string;
  profileImageUrl?: string;
  bio?: string;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
};
