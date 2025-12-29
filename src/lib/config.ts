/**
 * API Configuration
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://wihngo-api.onrender.com/api/";

export const APP_CONFIG = {
  apiUrl: API_URL,
  apiTimeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};

export const FEATURES = {
  enableNotifications: true,
  enableAnalytics: false,
  enableOfflineMode: false,
};

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
};

export const IMAGE_CONFIG = {
  maxSizeBytes: 5 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  compressionQuality: 0.8,
};

export const VALIDATION = {
  minPasswordLength: 8,
  maxPasswordLength: 128,
  minUsernameLength: 3,
  maxUsernameLength: 30,
  maxBioLength: 500,
  maxStoryContentLength: 2000,
  maxStoryTitleLength: 100,
  maxCommentLength: 500,
};

// Solana configuration
// Auto-detect network based on environment: production uses mainnet, development uses devnet
const isProduction = process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_SOLANA_NETWORK !== "devnet"; // Allow override in production for testing

const defaultNetwork = isProduction ? "mainnet-beta" : "devnet";
const defaultUsdcMint = isProduction
  ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // Mainnet USDC
  : "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Devnet USDC

export const SOLANA_CONFIG = {
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || defaultNetwork) as "devnet" | "mainnet-beta",
  usdcMint: process.env.NEXT_PUBLIC_USDC_MINT || defaultUsdcMint,
  // Wihngo platform wallet to receive platform support
  wihngoWallet: process.env.NEXT_PUBLIC_WIHNGO_WALLET || "6GXVP4mTMNqihNARivweYwc6rtuih1ivoJN7bcAEWWCV",
  // RPC endpoints
  rpcUrl: isProduction
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com",
};
