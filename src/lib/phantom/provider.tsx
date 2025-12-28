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
        providers: ["injected"], // Use browser extension when available
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
