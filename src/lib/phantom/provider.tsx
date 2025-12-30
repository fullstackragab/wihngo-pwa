"use client";

import { PhantomProvider as PhantomSDKProvider, lightTheme } from "@phantom/react-sdk";
import { AddressType } from "@phantom/browser-sdk";
import { ReactNode, useEffect, useState } from "react";

interface PhantomProviderProps {
  children: ReactNode;
}

/**
 * Phantom Wallet Provider
 *
 * On desktop: Uses Phantom SDK for browser extension integration
 * On mobile: Skips SDK to use custom deep linking (SDK overlay interferes with deeplinks)
 */
export function PhantomProvider({ children }: PhantomProviderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );
    setIsMobile(mobile);
  }, []);

  // During SSR or before hydration, render children directly
  if (!isClient) {
    return <>{children}</>;
  }

  // On mobile, skip the SDK provider to avoid "Download Phantom" overlay
  // Our custom deep linking in use-phantom.ts handles mobile wallet connection
  if (isMobile) {
    return <>{children}</>;
  }

  // On desktop, use the SDK for browser extension support
  return (
    <PhantomSDKProvider
      config={{
        appId: "7d9683b1-be04-4a3b-a582-64ad800d8d04",
        providers: ["injected"], // Only browser extension on desktop
        addressTypes: [AddressType.solana],
      }}
      theme={lightTheme}
      appName="Wihngo"
    >
      {children}
    </PhantomSDKProvider>
  );
}

export default PhantomProvider;
