/**
 * Idempotency Key Generation
 *
 * Generates deterministic keys for payment requests to prevent duplicate payments.
 * Same inputs within the same time window = same key = same intent returned by backend.
 */

// Cache for idempotency keys
const CACHE_PREFIX = "idempotency_";
const CACHE_TTL_MS = 60 * 1000; // 1 minute

interface CachedKey {
  key: string;
  timestamp: number;
}

/**
 * Generate a SHA-256 hash of the input string
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a deterministic idempotency key for a payment.
 *
 * The key is based on:
 * - User ID (from session)
 * - Bird ID
 * - Amounts (with precision)
 * - Time bucket (rounded to nearest minute)
 *
 * Same inputs within the same minute = same key = backend returns existing intent.
 * This prevents duplicate payments from:
 * - Double-clicks
 * - Page refreshes
 * - Network retries
 */
export async function generateIdempotencyKey(params: {
  userId: string;
  birdId: string;
  birdAmount: number;
  wihngoAmount: number;
}): Promise<string> {
  const { userId, birdId, birdAmount, wihngoAmount } = params;

  // Round timestamp to nearest minute (prevents duplicates within 1 min)
  const minuteBucket = Math.floor(Date.now() / 60000);

  // Create deterministic string from all inputs
  const data = [
    userId,
    birdId,
    birdAmount.toFixed(6), // High precision for amounts
    wihngoAmount.toFixed(6),
    minuteBucket.toString(),
  ].join("|");

  // Generate SHA-256 hash
  const fullHash = await sha256(data);

  // Return first 32 chars (128 bits, plenty unique)
  return fullHash.slice(0, 32);
}

/**
 * Get a cached idempotency key or generate a new one.
 * Caches in localStorage to survive page refreshes within the time window.
 *
 * @param params - Payment parameters
 * @returns Idempotency key string
 */
export async function getOrCreateIdempotencyKey(params: {
  userId: string;
  birdId: string;
  birdAmount: number;
  wihngoAmount: number;
}): Promise<string> {
  if (typeof localStorage === "undefined") {
    // No localStorage available, just generate a new key
    return generateIdempotencyKey(params);
  }

  const cacheKey = `${CACHE_PREFIX}${params.birdId}_${params.birdAmount}_${params.wihngoAmount}`;

  // Try to get from cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { key, timestamp } = JSON.parse(cached) as CachedKey;

      // Use cached key if less than 1 minute old
      if (Date.now() - timestamp < CACHE_TTL_MS) {
        return key;
      }
    } catch {
      // Invalid cache, regenerate
    }
  }

  // Generate new key
  const newKey = await generateIdempotencyKey(params);

  // Cache it
  const cacheValue: CachedKey = {
    key: newKey,
    timestamp: Date.now(),
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheValue));

  return newKey;
}

/**
 * Clear cached idempotency key after successful payment.
 * Should be called after a payment is confirmed to allow new payments.
 *
 * @param birdId - Bird ID to clear keys for
 */
export function clearIdempotencyKey(birdId: string): void {
  if (typeof localStorage === "undefined") return;

  // Clear all idempotency keys for this bird
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${CACHE_PREFIX}${birdId}_`)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Clear all cached idempotency keys.
 * Useful for debugging or when user wants to force a new payment.
 */
export function clearAllIdempotencyKeys(): void {
  if (typeof localStorage === "undefined") return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// ============================================
// SUBMIT IDEMPOTENCY (for transaction submission)
// ============================================

const SUBMIT_ATTEMPT_PREFIX = "submit_attempt_";

/**
 * Generate idempotency key for transaction submission.
 * Format: {paymentId}-{attemptNumber}-{timestamp}
 *
 * This ensures each submission attempt has a unique key,
 * while allowing the backend to detect duplicate submissions.
 *
 * @param paymentId - The payment/intent ID
 * @returns Idempotency key string (8-64 chars as required by backend)
 */
export function generateSubmitIdempotencyKey(paymentId: string): string {
  const attemptNumber = getSubmitAttemptNumber(paymentId);
  const timestamp = Date.now();

  // Format: {paymentId}-{attemptNumber}-{timestamp}
  // This creates a unique key for each attempt while being deterministic
  return `${paymentId}-${attemptNumber}-${timestamp}`;
}

/**
 * Get the current attempt number for a payment submission.
 * Increments automatically on each call.
 *
 * @param paymentId - The payment/intent ID
 * @returns Current attempt number (starts at 1)
 */
export function getSubmitAttemptNumber(paymentId: string): number {
  if (typeof localStorage === "undefined") {
    return 1;
  }

  const key = `${SUBMIT_ATTEMPT_PREFIX}${paymentId}`;
  const stored = localStorage.getItem(key);

  let attemptNumber = 1;
  if (stored) {
    try {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        attemptNumber = parsed + 1;
      }
    } catch {
      // Invalid stored value, start at 1
    }
  }

  // Store the new attempt number
  localStorage.setItem(key, attemptNumber.toString());

  return attemptNumber;
}

/**
 * Clear submit attempt counter for a payment.
 * Should be called after successful submission.
 *
 * @param paymentId - The payment/intent ID
 */
export function clearSubmitAttempts(paymentId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(`${SUBMIT_ATTEMPT_PREFIX}${paymentId}`);
}

/**
 * Clear all submit attempt counters.
 */
export function clearAllSubmitAttempts(): void {
  if (typeof localStorage === "undefined") return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(SUBMIT_ATTEMPT_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
