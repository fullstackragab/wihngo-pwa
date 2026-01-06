/**
 * Bird Types
 *
 * CORE PRINCIPLE: All birds are equal.
 * - No premium birds
 * - No boosted visibility
 * - No paid prioritization
 * - Support is guided by need, not money
 */

export type BirdActivityStatus = "Active" | "Quiet" | "Inactive" | "Memorial";

export type Bird = {
  birdId: string;
  name: string;
  species: string;
  commonName?: string;
  scientificName?: string;
  tagline: string;
  description?: string;
  imageUrl?: string;
  imageS3Key?: string;
  coverImageUrl?: string;
  coverImageS3Key?: string;
  videoUrl?: string;
  videoS3Key?: string;
  lovedBy: number;
  supportedBy: number;
  ownerId: string;
  ownerName?: string;
  ownerWalletAddress?: string; // Solana wallet to receive support
  age?: string;
  location?: string;
  isLoved?: boolean;
  isSupported?: boolean;
  totalSupport?: number;
  isMemorial?: boolean;
  activityStatus?: BirdActivityStatus;
  lastSeenText?: string;
  canSupport?: boolean;
  supportEnabled?: boolean;
  supportUnavailableMessage?: string;
  isPublic?: boolean | null; // Only returned to owner: true = visible, false = hidden/draft
  needsSupport?: boolean; // Owner can mark bird as needing support
  timesSupportedThisWeek?: number; // 0-2: how many times supported this week (resets weekly)
  allRoundsComplete?: boolean; // True if bird has received support in all rounds this week
};

export type BirdSupport = {
  supportId: string;
  birdId: string;
  userId: string;
  userName?: string;
  amount: number;
  message?: string;
  transactionSignature?: string; // Solana transaction signature
  createdAt: string;
};

export type BirdHealthLog = {
  logId: string;
  birdId: string;
  logType: "vet" | "food" | "medicine" | "other";
  title: string;
  description: string;
  cost?: number;
  imageUrl?: string;
  imageS3Key?: string;
  createdAt: string;
};

export type CreateBirdDto = {
  name: string;
  species: string;
  commonName?: string;
  scientificName?: string;
  description?: string;
  imageS3Key?: string;
  coverImageS3Key?: string;
  videoS3Key?: string;
  age?: string;
  location?: string;
  walletAddress: string; // Required: Solana wallet to receive support
};

export type UpdateBirdDto = Partial<Omit<CreateBirdDto, 'walletAddress'>> & {
  walletAddress?: string; // Optional on update
  supportEnabled?: boolean; // Toggle to accept/reject support
  isPublic?: boolean; // Toggle visibility (draft mode)
};

export type UpdateBirdVisibilityDto = {
  isPublic: boolean;
};

export type UpdateBirdVisibilityResponse = {
  success: boolean;
  isPublic: boolean;
  message: string;
};

export type UpdateBirdNeedsSupportDto = {
  needsSupport: boolean;
};

export type UpdateBirdNeedsSupportResponse = {
  success: boolean;
  needsSupport: boolean;
  message: string;
};

// Bird in the needs-support list
export type BirdNeedsSupportDto = {
  birdId: string;
  name: string;
  species: string | null;
  tagline: string | null;
  imageUrl: string;
  location: string | null;
  ownerName: string;
  ownerId: string;
  timesSupportedThisWeek: number;
  lastSupportedAt: string | null;
  totalSupportCount: number;
};

// Birds needing support response with round info (2-round system)
export type BirdsNeedsSupportResponse = {
  currentRound: number | null; // 1 or 2, null if all complete
  totalRounds: number; // Always 2
  allRoundsComplete: boolean;
  thankYouMessage: string | null;
  howItWorks: string;
  birds: BirdNeedsSupportDto[];
  totalBirdsParticipating: number;
  birdsSupportedThisRound: number;
  birdsRemainingThisRound: number;
  weekStartDate: string;
  weekEndDate: string;
};

// Can support check response
export type CanSupportBirdResponse = {
  canReceiveSupport: boolean;
  message: string;
};

export type SupportBirdDto = {
  birdId: string;
  amount: number;
  message?: string;
};

// Memorial Types
export type MemorialMessage = {
  messageId: string;
  birdId: string;
  userId?: string;
  userName?: string;
  userImageUrl?: string;
  content: string;
  createdAt: string;
};

export type Memorial = {
  birdId: string;
  birdName: string;
  birdImageUrl?: string;
  birdSpecies?: string;
  memorialDate?: string;
  totalSupporters: number;
  totalSupport: number;
  messages: MemorialMessage[];
  supportHistory?: BirdSupport[];
};

export type CreateMemorialMessageDto = {
  content: string;
};
