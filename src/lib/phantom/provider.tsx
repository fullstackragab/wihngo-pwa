"use client";

import { PhantomProvider as PhantomSDKProvider, lightTheme } from "@phantom/react-sdk";
import { AddressType } from "@phantom/browser-sdk";
import { ReactNode } from "react";

interface PhantomProviderProps {
  children: ReactNode;
}

/**
 * Phantom Wallet Provider
 *
 * Wraps the application with Phantom SDK context.
 * Supports both web (browser extension) and mobile (deep linking).
 */
export function PhantomProvider({ children }: PhantomProviderProps) {
  return (
    <PhantomSDKProvider
      config={{
        appId: "7d9683b1-be04-4a3b-a582-64ad800d8d04",
        providers: ["injected", "deeplink", "phantom"], // Browser extension + mobile deeplink + Phantom app
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
