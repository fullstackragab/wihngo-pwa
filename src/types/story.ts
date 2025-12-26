export enum StoryMode {
  LoveAndBond = "LoveAndBond",
  NewBeginning = "NewBeginning",
  ProgressAndWins = "ProgressAndWins",
  FunnyMoment = "FunnyMoment",
  PeacefulMoment = "PeacefulMoment",
  LossAndMemory = "LossAndMemory",
  CareAndHealth = "CareAndHealth",
  DailyLife = "DailyLife",
}

export const STORY_MOODS = [
  {
    value: StoryMode.LoveAndBond,
    label: "Love & Bond",
    emoji: "💕",
    description: "Affection, trust, cuddles, attachment",
  },
  {
    value: StoryMode.NewBeginning,
    label: "New Beginning",
    emoji: "🐣",
    description: "New bird, adoption, rescue, first day",
  },
  {
    value: StoryMode.ProgressAndWins,
    label: "Progress & Wins",
    emoji: "🎉",
    description: "Training success, health improvement, milestones",
  },
  {
    value: StoryMode.FunnyMoment,
    label: "Funny Moment",
    emoji: "😄",
    description: "Silly behavior, unexpected actions",
  },
  {
    value: StoryMode.PeacefulMoment,
    label: "Peaceful Moment",
    emoji: "🕊️",
    description: "Calm, beautiful, emotional silence",
  },
  {
    value: StoryMode.LossAndMemory,
    label: "Loss & Memory",
    emoji: "😢",
    description: "Passing away, remembrance, grief",
  },
  {
    value: StoryMode.CareAndHealth,
    label: "Care & Health",
    emoji: "🩺",
    description: "Vet visits, recovery, advice, awareness",
  },
  {
    value: StoryMode.DailyLife,
    label: "Daily Life",
    emoji: "🌿",
    description: "Normal routines, everyday moments",
  },
] as const;

export type StoryBird = {
  birdId: string;
  name: string;
  species?: string;
  imageS3Key?: string;
  imageUrl?: string;
  videoS3Key?: string;
  videoUrl?: string;
  tagline?: string;
  lovedBy?: number;
  supportedBy?: number;
  ownerId?: string;
};

export type Story = {
  storyId: string;
  birds: string[];
  mode?: StoryMode | null;
  date: string;
  preview: string;
  imageS3Key?: string | null;
  imageUrl?: string | null;
  videoS3Key?: string | null;
  videoUrl?: string | null;
  audioS3Key?: string | null;
  audioUrl?: string | null;
  likeCount?: number;
  commentCount?: number;
};

export type StoryComment = {
  commentId: string;
  storyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
};

export type CreateStoryDto = {
  content: string;
  birdId: string;
  mode?: StoryMode | null;
  imageS3Key?: string | null;
  videoS3Key?: string | null;
  audioS3Key?: string | null;
};

export type UpdateStoryDto = {
  content?: string;
  imageS3Key?: string | null;
  videoS3Key?: string | null;
  mode?: StoryMode | null;
  birdIds?: string[];
};

export type StoryDetailDto = {
  storyId: string;
  content: string;
  mode?: StoryMode | null;
  imageS3Key?: string | null;
  imageUrl?: string | null;
  videoS3Key?: string | null;
  videoUrl?: string | null;
  audioS3Key?: string | null;
  audioUrl?: string | null;
  createdAt: string;
  birds: StoryBird[];
  author: {
    userId: string;
    name: string;
  };
  likeCount?: number;
  commentCount?: number;
};

export type StoryListResponse = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: Story[];
};
