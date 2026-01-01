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
 * Detect if running on iOS device
 */
export function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
}

/**
 * Detect if running on Android device
 */
export function isAndroidDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /android/i.test(navigator.userAgent.toLowerCase());
}

/**
 * Detect if running as iOS PWA (installed to home screen)
 * iOS PWA has unique challenges:
 * - Phantom opens Safari, not the PWA
 * - User must manually return to PWA
 * - State may be lost if PWA is killed by OS
 */
export function isIOSPWA(): boolean {
  if (typeof window === "undefined") return false;

  const isIOS = isIOSDevice();
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isIOS && isStandalone;
}

/**
 * Detect if running as Android PWA
 */
export function isAndroidPWA(): boolean {
  if (typeof window === "undefined") return false;

  const isAndroid = isAndroidDevice();
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return isAndroid && isStandalone;
}

/**
 * Detect if running as any PWA
 */
export function isPWA(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export interface PhantomRedirectInstructions {
  beforeRedirect: string;
  afterApproval: string;
  showManualReturn: boolean;
  showPolling: boolean;
}

/**
 * Get platform-specific instructions for Phantom redirect
 */
export function getPhantomRedirectInstructions(): PhantomRedirectInstructions {
  if (isIOSPWA()) {
    return {
      beforeRedirect: "You'll be redirected to Phantom. After approving, return to this app manually.",
      afterApproval: "Approved in Phantom? Tap the button below to continue.",
      showManualReturn: true,
      showPolling: true,
    };
  }

  if (isAndroidPWA()) {
    return {
      beforeRedirect: "Opening Phantom...",
      afterApproval: "Waiting for Phantom...",
      showManualReturn: false, // Android usually returns automatically
      showPolling: false,
    };
  }

  if (isMobileDevice()) {
    return {
      beforeRedirect: "Opening Phantom...",
      afterApproval: "Approve in Phantom, then return here.",
      showManualReturn: true,
      showPolling: false,
    };
  }

  // Desktop
  return {
    beforeRedirect: "Approve in your Phantom extension.",
    afterApproval: "Confirm in Phantom...",
    showManualReturn: false,
    showPolling: false,
  };
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
