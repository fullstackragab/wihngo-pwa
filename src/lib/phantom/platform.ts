/**
 * Platform Detection Utilities for Phantom Wallet
 */

export type Platform = "desktop-web" | "mobile-web" | "mobile-pwa";

export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop-web";

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  );

  if (!isMobile) return "desktop-web";

  // Check if running as installed PWA
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isStandalone ? "mobile-pwa" : "mobile-web";
}

export function isPhantomInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.phantom?.solana?.isPhantom || window.solana?.isPhantom);
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent.toLowerCase()
  );
}

/**
 * Get the Phantom deep link for mobile
 */
export function getPhantomDeepLink(
  action: "connect" | "signAndSendTransaction",
  params: Record<string, string>
): string {
  const baseUrl = "https://phantom.app/ul/v1";
  const queryString = new URLSearchParams(params).toString();
  return `${baseUrl}/${action}?${queryString}`;
}

/**
 * Get the redirect URL for Phantom callbacks
 */
export function getRedirectUrl(path: string = "/phantom-callback"): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  return `${origin}${path}`;
}

/**
 * Parse Phantom deep link response from URL
 */
export function parsePhantomResponse(url: string): {
  success: boolean;
  publicKey?: string;
  signature?: string;
  errorCode?: string;
  errorMessage?: string;
} {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const errorCode = params.get("errorCode");
    if (errorCode) {
      return {
        success: false,
        errorCode,
        errorMessage: params.get("errorMessage") || "Unknown error",
      };
    }

    return {
      success: true,
      publicKey: params.get("phantom_encryption_public_key") || undefined,
      signature: params.get("signature") || undefined,
    };
  } catch {
    return { success: false, errorMessage: "Failed to parse response" };
  }
}
