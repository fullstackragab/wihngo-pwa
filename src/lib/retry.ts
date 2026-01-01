/**
 * Retry Utility
 *
 * Generic retry utility with exponential backoff for handling transient failures.
 * Use this for API calls that may fail due to network issues.
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error) => {
    // Default: retry on network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return true;
    }
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes("network") ||
        msg.includes("timeout") ||
        msg.includes("congestion") ||
        msg.includes("connection") ||
        msg.includes("fetch")
      );
    }
    return false;
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry on failure
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, shouldRetry } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if not a retryable error
      if (!shouldRetry!(error)) {
        throw error;
      }

      // Don't retry if out of attempts
      if (attempt >= maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      console.log(
        `[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry config presets for different scenarios
 */
export const RETRY_PRESETS = {
  /**
   * For API calls that may fail due to network issues
   * 3 attempts with 1s, 2s, 4s delays (max 5s)
   */
  network: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  } as Partial<RetryConfig>,

  /**
   * For blockchain operations that may need more time
   * 5 attempts with 2s, 4s, 8s, 16s delays (max 15s)
   */
  blockchain: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 15000,
  } as Partial<RetryConfig>,

  /**
   * Quick retry for transient failures
   * 2 attempts with 500ms delay (max 1s)
   */
  quick: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 1000,
  } as Partial<RetryConfig>,

  /**
   * For balance checks that need quick feedback
   * 2 attempts with 1s delay
   */
  balance: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 2000,
  } as Partial<RetryConfig>,
} as const;

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return DEFAULT_CONFIG.shouldRetry!(error);
}

/**
 * Create a custom retry function with preset config
 */
export function createRetryFn(
  preset: Partial<RetryConfig>
): <T>(fn: () => Promise<T>) => Promise<T> {
  return <T>(fn: () => Promise<T>) => withRetry(fn, preset);
}
