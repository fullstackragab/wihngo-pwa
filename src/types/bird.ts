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
  ownerWalletAddress?: string; // Solana wallet to receive support payments
  age?: string;
  location?: string;
  isLoved?: boolean;
  isSupported?: boolean;
  totalSupport?: number;
  isMemorial?: boolean;
  activityStatus?: BirdActivityStatus;
  lastSeenText?: string;
  canSupport?: boolean;
  supportUnavailableMessage?: string;
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
};

export type SupportBirdDto = {
  birdId: string;
  amount: number;
  message?: string;
};
