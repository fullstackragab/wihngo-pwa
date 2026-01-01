# Wihngo Payment Flow - Frontend Implementation Tasks

## Overview

Frontend implementation tasks for the Phantom → USDC payment flow redesign.
Backend context is noted where relevant for API contracts.

---

## Phase 1: Critical Fixes (High Priority)

### 1.1 Session Recovery Service

> **Goal:** Detect and recover incomplete payment/connection sessions on page load.

#### Task 1.1.1: Create Session Recovery Service
- **File:** `src/services/session-recovery.service.ts` (new)
- **Description:** Service to detect and recover incomplete payment/connection sessions

```typescript
// src/services/session-recovery.service.ts

export type RecoveryStatus =
  | "no_session"           // Nothing to recover
  | "already_completed"    // Payment already went through
  | "awaiting_confirmation"// Waiting for blockchain
  | "resume_submission"    // Signed, needs submit
  | "resume_signing"       // Intent created, needs signature
  | "incomplete"           // Partial state, needs restart
  | "expired"              // Session timed out
  | "offline_recovery";    // Can't reach backend, use localStorage

export interface RecoveryResult {
  status: RecoveryStatus;
  intentId?: string;
  walletAddress?: string;
  supportParams?: {
    birdId: string;
    birdAmount: number;
    wihngoAmount: number;
  };
  solanaSignature?: string;
  serializedTransaction?: string;
  message?: string;
}

/**
 * Check for incomplete sessions and determine recovery action
 */
export async function recoverSession(): Promise<RecoveryResult>;

/**
 * Clear all local state (localStorage keys)
 */
export function clearAllLocalState(): void;

/**
 * Check if there's any pending state that needs recovery
 */
export function hasPendingSession(): boolean;
```

**Implementation Details:**
```typescript
import { getStoredSupportParams, clearSupportParams } from "./wallet-connect.service";

const INTENT_ID_KEY = "pending_payment_intent_id";
const INTENT_CREATED_KEY = "pending_payment_intent_created";
const WALLET_STEP_KEY = "wallet_connect_step";

export async function recoverSession(): Promise<RecoveryResult> {
  // 1. Check localStorage for pending intent
  const pendingIntentId = localStorage.getItem(INTENT_ID_KEY);
  const supportParams = getStoredSupportParams();
  const walletStep = localStorage.getItem(WALLET_STEP_KEY);

  // No pending session
  if (!pendingIntentId && !supportParams && !walletStep) {
    return { status: "no_session" };
  }

  // 2. Check for stale wallet connection (>5 minutes)
  if (walletStep) {
    const timestamp = localStorage.getItem("wallet_connect_timestamp");
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age > 5 * 60 * 1000) {
        clearAllLocalState();
        return { status: "expired", message: "Wallet connection timed out" };
      }
    }
  }

  // 3. If we have an intent ID, check backend status
  if (pendingIntentId) {
    try {
      const response = await fetch(`/api/support/intents/${pendingIntentId}`);

      if (!response.ok) {
        if (response.status === 404) {
          clearAllLocalState();
          return { status: "expired", message: "Payment session not found" };
        }
        throw new Error("Failed to check intent status");
      }

      const intent = await response.json();

      switch (intent.status) {
        case "confirmed":
          clearAllLocalState();
          return {
            status: "already_completed",
            solanaSignature: intent.solanaSignature,
            intentId: pendingIntentId,
          };

        case "submitted":
          return {
            status: "awaiting_confirmation",
            intentId: pendingIntentId,
          };

        case "signed":
          return {
            status: "resume_submission",
            intentId: pendingIntentId,
          };

        case "pending":
          return {
            status: "resume_signing",
            intentId: pendingIntentId,
            serializedTransaction: intent.serializedTransaction,
            supportParams: intent.supportParams,
          };

        case "expired":
          clearAllLocalState();
          return { status: "expired", message: "Payment session expired" };

        default:
          return { status: "incomplete", supportParams };
      }
    } catch (error) {
      // Backend unreachable - rely on localStorage
      console.error("Failed to check intent status:", error);
      return {
        status: "offline_recovery",
        supportParams,
        message: "Unable to verify payment status. Please check your connection.",
      };
    }
  }

  // 4. Only localStorage state exists (no intent created yet)
  return {
    status: "incomplete",
    supportParams,
  };
}

export function clearAllLocalState(): void {
  // Payment intent state
  localStorage.removeItem(INTENT_ID_KEY);
  localStorage.removeItem(INTENT_CREATED_KEY);

  // Wallet connection state
  localStorage.removeItem("wallet_connect_state");
  localStorage.removeItem("wallet_connect_message");
  localStorage.removeItem("wallet_connect_dapp_secret");
  localStorage.removeItem("wallet_connect_dapp_public");
  localStorage.removeItem("wallet_connect_phantom_public");
  localStorage.removeItem("wallet_connect_phantom_session");
  localStorage.removeItem("wallet_connect_wallet_public");
  localStorage.removeItem("wallet_connect_step");
  localStorage.removeItem("wallet_connect_redirect_url");
  localStorage.removeItem("wallet_connect_support_params");
  localStorage.removeItem("wallet_connect_timestamp");

  // Support params
  clearSupportParams();
}

export function hasPendingSession(): boolean {
  return !!(
    localStorage.getItem(INTENT_ID_KEY) ||
    localStorage.getItem(WALLET_STEP_KEY) ||
    getStoredSupportParams()
  );
}
```

**Acceptance Criteria:**
- [ ] Checks localStorage for pending intents
- [ ] Calls backend to get intent status (if intent ID exists)
- [ ] Returns appropriate recovery action
- [ ] Handles offline scenario gracefully
- [ ] Clears stale state (>5 min wallet connections)

---

#### Task 1.1.2: Create Recovery Modal Component
- **File:** `src/components/payment/RecoveryModal.tsx` (new)
- **Description:** Modal shown when incomplete session is detected

```tsx
// src/components/payment/RecoveryModal.tsx

import { RecoveryResult } from "@/services/session-recovery.service";

interface RecoveryModalProps {
  recovery: RecoveryResult;
  onContinue: () => void;
  onStartOver: () => void;
  isOpen: boolean;
}

export function RecoveryModal({
  recovery,
  onContinue,
  onStartOver,
  isOpen,
}: RecoveryModalProps) {
  if (!isOpen) return null;

  const getContent = () => {
    switch (recovery.status) {
      case "already_completed":
        return {
          title: "Payment Already Complete",
          message: "Your previous payment was successful!",
          showContinue: false,
          continueText: "",
          startOverText: "Done",
        };

      case "awaiting_confirmation":
        return {
          title: "Payment Processing",
          message: "Your payment is being confirmed on Solana. This usually takes a few seconds.",
          showContinue: true,
          continueText: "Check Status",
          startOverText: "Cancel",
        };

      case "resume_signing":
        return {
          title: "Continue Payment?",
          message: `You have an incomplete payment for $${recovery.supportParams?.birdAmount?.toFixed(2) || "0.00"}. Would you like to continue?`,
          showContinue: true,
          continueText: "Continue",
          startOverText: "Start Over",
        };

      case "incomplete":
        return {
          title: "Resume Payment?",
          message: "You have an unfinished payment. Would you like to continue where you left off?",
          showContinue: true,
          continueText: "Continue",
          startOverText: "Start Over",
        };

      case "expired":
        return {
          title: "Session Expired",
          message: recovery.message || "Your payment session has expired. Please start a new payment.",
          showContinue: false,
          continueText: "",
          startOverText: "Start New Payment",
        };

      case "offline_recovery":
        return {
          title: "Connection Issue",
          message: "We couldn't verify your payment status. Please check your internet connection.",
          showContinue: true,
          continueText: "Retry",
          startOverText: "Start Over",
        };

      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-2">{content.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{content.message}</p>

        <div className="flex gap-3">
          {content.showContinue && (
            <button
              onClick={onContinue}
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              {content.continueText}
            </button>
          )}
          <button
            onClick={onStartOver}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              content.showContinue
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {content.startOverText}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows appropriate message for each recovery status
- [ ] "Continue" resumes flow at correct step
- [ ] "Start Over" clears state and resets
- [ ] Handles "already_completed" (shows success, no continue option)
- [ ] Handles "expired" (shows message, only start over option)

---

#### Task 1.1.3: Integrate Recovery into Support Confirm Page
- **File:** `src/app/[locale]/birds/[birdId]/support/confirm/page.tsx`
- **Description:** Add session recovery check on page mount

**Changes to make:**

```tsx
// Add to imports
import { recoverSession, clearAllLocalState, RecoveryResult } from "@/services/session-recovery.service";
import { RecoveryModal } from "@/components/payment/RecoveryModal";

// Add state
const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null);
const [showRecoveryModal, setShowRecoveryModal] = useState(false);

// Add useEffect for recovery check
useEffect(() => {
  async function checkForRecovery() {
    const result = await recoverSession();

    if (result.status !== "no_session") {
      setRecoveryResult(result);
      setShowRecoveryModal(true);
    }
  }

  // Only check on initial mount, not on Phantom callback
  const isPhantomCallback = new URL(window.location.href).searchParams.has("phantom_encryption_public_key");
  if (!isPhantomCallback) {
    checkForRecovery();
  }
}, []);

// Add handlers
const handleContinueRecovery = () => {
  setShowRecoveryModal(false);

  if (!recoveryResult) return;

  switch (recoveryResult.status) {
    case "resume_signing":
      // Resume at signing step with existing transaction
      setPaymentStep("awaiting_signature");
      setSerializedTransaction(recoveryResult.serializedTransaction);
      break;

    case "awaiting_confirmation":
      // Poll for confirmation
      setPaymentStep("confirming");
      pollForConfirmation(recoveryResult.intentId!);
      break;

    case "incomplete":
      // Restore support params and continue
      if (recoveryResult.supportParams) {
        setBirdAmount(recoveryResult.supportParams.birdAmount);
        setWihngoAmount(recoveryResult.supportParams.wihngoAmount);
      }
      break;

    case "already_completed":
      // Redirect to success
      router.push(`/${locale}/birds/${birdId}/support/success?signature=${recoveryResult.solanaSignature}`);
      break;
  }
};

const handleStartOver = () => {
  clearAllLocalState();
  setRecoveryResult(null);
  setShowRecoveryModal(false);
  // Reset all payment state
  setPaymentStep("idle");
  setBirdAmount(PRESET_BIRD_AMOUNTS[0]);
  setWihngoAmount(DEFAULT_WIHNGO_SUPPORT);
};

// Add modal to JSX
<RecoveryModal
  recovery={recoveryResult}
  onContinue={handleContinueRecovery}
  onStartOver={handleStartOver}
  isOpen={showRecoveryModal}
/>
```

**Acceptance Criteria:**
- [ ] Recovery check runs on page load
- [ ] Does NOT run when returning from Phantom callback
- [ ] Shows recovery modal if session found
- [ ] "Continue" resumes at correct step
- [ ] "Start over" clears all state

---

#### Task 1.1.4: Add Recovery to usePhantom Hook
- **File:** `src/hooks/use-phantom.ts`
- **Description:** Add stale state detection and cleanup

**Add to the hook:**

```typescript
// Add timestamp when starting connection
const startConnection = useCallback((method: ConnectionMethod) => {
  localStorage.setItem("wallet_connect_timestamp", Date.now().toString());
  // ... existing code
}, []);

// Add stale state check
const checkForStaleState = useCallback(() => {
  const timestamp = localStorage.getItem("wallet_connect_timestamp");
  const step = localStorage.getItem(CONNECT_STEP_KEY);

  if (timestamp && step) {
    const age = Date.now() - parseInt(timestamp);
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (age > FIVE_MINUTES) {
      console.log("Clearing stale wallet connection state");
      clearWalletConnectState();
      return true;
    }
  }
  return false;
}, []);

// Call on hook init
useEffect(() => {
  checkForStaleState();
}, [checkForStaleState]);
```

**Acceptance Criteria:**
- [ ] Timestamp stored when connection starts
- [ ] Stale state (>5 min) auto-cleared on hook init
- [ ] Does not interfere with active connections

---

### 1.2 iOS PWA Special Handling

> **Goal:** Handle the unique challenges of iOS PWA where Phantom opens Safari, potentially not returning to PWA.

#### Task 1.2.1: Add iOS PWA Detection
- **File:** `src/lib/phantom/platform.ts`
- **Description:** Add specific iOS PWA detection function

```typescript
// Add to src/lib/phantom/platform.ts

/**
 * Detect if running as iOS PWA (installed to home screen)
 * iOS PWA has unique challenges:
 * - Phantom opens Safari, not the PWA
 * - User must manually return to PWA
 * - State may be lost if PWA is killed
 */
export function isIOSPWA(): boolean {
  if (typeof window === "undefined") return false;

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  return isIOS && isStandalone;
}

/**
 * Detect if running as Android PWA
 */
export function isAndroidPWA(): boolean {
  if (typeof window === "undefined") return false;

  const isAndroid = /Android/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return isAndroid && isStandalone;
}

/**
 * Get platform-specific instructions for Phantom redirect
 */
export function getPhantomRedirectInstructions(): {
  beforeRedirect: string;
  afterApproval: string;
  showManualReturn: boolean;
} {
  if (isIOSPWA()) {
    return {
      beforeRedirect: "You'll be redirected to Phantom. After approving, return to this app manually.",
      afterApproval: "Approved in Phantom? Tap here to continue.",
      showManualReturn: true,
    };
  }

  if (isAndroidPWA()) {
    return {
      beforeRedirect: "Opening Phantom...",
      afterApproval: "Waiting for Phantom...",
      showManualReturn: false, // Android usually returns automatically
    };
  }

  if (isMobileDevice()) {
    return {
      beforeRedirect: "Opening Phantom...",
      afterApproval: "Approve in Phantom, then return here.",
      showManualReturn: true,
    };
  }

  // Desktop
  return {
    beforeRedirect: "Approve in your Phantom extension.",
    afterApproval: "Confirm in Phantom...",
    showManualReturn: false,
  };
}
```

**Acceptance Criteria:**
- [ ] `isIOSPWA()` correctly identifies iOS PWA
- [ ] Works on iPhone, iPad, iPod
- [ ] Distinguishes from iOS Safari
- [ ] `getPhantomRedirectInstructions()` returns platform-specific text

---

#### Task 1.2.2: Create iOS PWA Waiting Component
- **File:** `src/components/phantom/IOSPWAWaiting.tsx` (new)
- **Description:** UI shown while waiting for iOS PWA user to return from Phantom

```tsx
// src/components/phantom/IOSPWAWaiting.tsx

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface IOSPWAWaitingProps {
  intentId?: string;
  onStatusCheck: () => Promise<"pending" | "completed" | "failed" | "expired">;
  onComplete: () => void;
  onExpired: () => void;
  onManualCheck: () => void;
}

export function IOSPWAWaiting({
  intentId,
  onStatusCheck,
  onComplete,
  onExpired,
  onManualCheck,
}: IOSPWAWaitingProps) {
  const [status, setStatus] = useState<"waiting" | "checking" | "complete" | "failed" | "expired">("waiting");
  const [checkCount, setCheckCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Auto-poll every 3 seconds (up to 100 times = 5 minutes)
  useEffect(() => {
    if (status !== "waiting" && status !== "checking") return;
    if (checkCount >= 100) {
      setStatus("expired");
      onExpired();
      return;
    }

    const interval = setInterval(async () => {
      setStatus("checking");
      setLastCheckTime(new Date());

      try {
        const result = await onStatusCheck();
        setCheckCount(c => c + 1);

        if (result === "completed") {
          setStatus("complete");
          onComplete();
        } else if (result === "failed" || result === "expired") {
          setStatus(result);
          if (result === "expired") onExpired();
        } else {
          setStatus("waiting");
        }
      } catch (error) {
        console.error("Status check failed:", error);
        setStatus("waiting");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, checkCount, onStatusCheck, onComplete, onExpired]);

  const handleManualCheck = async () => {
    setStatus("checking");
    onManualCheck();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      {/* Status Icon */}
      <div className="mb-4">
        {status === "waiting" && (
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}
        {status === "checking" && (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
        {status === "complete" && (
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        )}
        {(status === "failed" || status === "expired") && (
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        )}
      </div>

      {/* Status Message */}
      <h3 className="text-lg font-semibold mb-2">
        {status === "waiting" && "Waiting for Phantom"}
        {status === "checking" && "Checking status..."}
        {status === "complete" && "Approved!"}
        {status === "failed" && "Something went wrong"}
        {status === "expired" && "Session expired"}
      </h3>

      <p className="text-gray-600 mb-6 max-w-xs">
        {status === "waiting" && "After approving in Phantom, tap the button below to continue."}
        {status === "checking" && "Verifying your approval..."}
        {status === "complete" && "Redirecting..."}
        {status === "failed" && "The transaction was rejected or failed. Please try again."}
        {status === "expired" && "Your session timed out. Please start a new payment."}
      </p>

      {/* Manual Check Button */}
      {(status === "waiting" || status === "checking") && (
        <button
          onClick={handleManualCheck}
          disabled={status === "checking"}
          className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {status === "checking" ? "Checking..." : "I approved in Phantom"}
        </button>
      )}

      {/* Retry/Cancel for failed states */}
      {(status === "failed" || status === "expired") && (
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition"
        >
          Start Over
        </button>
      )}

      {/* Status indicator */}
      {(status === "waiting" || status === "checking") && (
        <p className="text-sm text-gray-400 mt-4">
          {lastCheckTime
            ? `Last checked: ${lastCheckTime.toLocaleTimeString()}`
            : "Checking automatically every few seconds..."}
        </p>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows spinner while waiting
- [ ] Auto-polls every 3 seconds
- [ ] "I approved in Phantom" button for manual check
- [ ] Shows success state when complete
- [ ] Times out after 5 minutes
- [ ] Clear messaging for iOS users

---

#### Task 1.2.3: Update Wallet Connect Service for iOS PWA
- **File:** `src/services/wallet-connect.service.ts`
- **Description:** Add iOS PWA-specific flow

**Add to wallet-connect.service.ts:**

```typescript
import { isIOSPWA, getPhantomRedirectInstructions } from "@/lib/phantom/platform";

// Add new storage key
const IOS_PWA_PENDING_KEY = "ios_pwa_pending_action";

interface IOSPWAPendingAction {
  action: "connect" | "sign" | "signTransaction";
  timestamp: number;
  intentId?: string;
  returnUrl: string;
}

/**
 * Store pending action for iOS PWA before redirecting to Phantom
 */
export function storeIOSPWAPendingAction(action: IOSPWAPendingAction): void {
  localStorage.setItem(IOS_PWA_PENDING_KEY, JSON.stringify(action));
}

/**
 * Get pending iOS PWA action (if any)
 */
export function getIOSPWAPendingAction(): IOSPWAPendingAction | null {
  const stored = localStorage.getItem(IOS_PWA_PENDING_KEY);
  if (!stored) return null;

  try {
    const action = JSON.parse(stored) as IOSPWAPendingAction;

    // Check if expired (5 minutes)
    if (Date.now() - action.timestamp > 5 * 60 * 1000) {
      clearIOSPWAPendingAction();
      return null;
    }

    return action;
  } catch {
    return null;
  }
}

/**
 * Clear pending iOS PWA action
 */
export function clearIOSPWAPendingAction(): void {
  localStorage.removeItem(IOS_PWA_PENDING_KEY);
}

/**
 * Modified connect flow for iOS PWA
 * Stores extra state and shows special instructions
 */
export async function connectWalletIOSPWA(): Promise<{
  deepLinkUrl: string;
  instructions: ReturnType<typeof getPhantomRedirectInstructions>;
}> {
  // Generate keypair and build connect URL (existing logic)
  const { publicKey, secretKey } = generateDappKeypair();
  storeDappKeypair(publicKey, secretKey);

  const state = generateState();
  const message = generateConnectMessage();
  storeLocalIntent(state, message);

  // Store iOS PWA specific state
  storeIOSPWAPendingAction({
    action: "connect",
    timestamp: Date.now(),
    returnUrl: window.location.href,
  });

  const redirectUrl = new URL(window.location.href);
  redirectUrl.searchParams.set("phantom_callback", "true");

  const deepLinkUrl = buildPhantomConnectUrl({
    dappPublicKey: publicKey,
    redirectUrl: redirectUrl.toString(),
    cluster: SOLANA_CONFIG.network,
  });

  return {
    deepLinkUrl,
    instructions: getPhantomRedirectInstructions(),
  };
}
```

**Acceptance Criteria:**
- [ ] Stores pending action before redirect
- [ ] Includes timestamp for expiry
- [ ] Returns platform-specific instructions
- [ ] Clears stale actions automatically

---

#### Task 1.2.4: Integrate iOS PWA Flow into Support Page
- **File:** `src/app/[locale]/birds/[birdId]/support/confirm/page.tsx`
- **Description:** Use iOS PWA waiting component when appropriate

**Add to the support page:**

```tsx
import { isIOSPWA } from "@/lib/phantom/platform";
import { IOSPWAWaiting } from "@/components/phantom/IOSPWAWaiting";
import { getIOSPWAPendingAction, clearIOSPWAPendingAction } from "@/services/wallet-connect.service";

// Add state
const [showIOSPWAWaiting, setShowIOSPWAWaiting] = useState(false);
const [iosPWAIntentId, setIOSPWAIntentId] = useState<string | null>(null);

// Check for iOS PWA pending action on mount
useEffect(() => {
  if (isIOSPWA()) {
    const pendingAction = getIOSPWAPendingAction();
    if (pendingAction) {
      setShowIOSPWAWaiting(true);
      setIOSPWAIntentId(pendingAction.intentId || null);
    }
  }
}, []);

// Status check function for iOS PWA
const checkIOSPWAStatus = async (): Promise<"pending" | "completed" | "failed" | "expired"> => {
  // Check if wallet is now connected
  const wallet = getConnectedWallet();
  if (wallet) {
    return "completed";
  }

  // Check backend intent if we have one
  if (iosPWAIntentId) {
    try {
      const response = await fetch(`/api/support/intents/${iosPWAIntentId}`);
      const intent = await response.json();

      if (intent.status === "confirmed") return "completed";
      if (intent.status === "failed") return "failed";
      if (intent.status === "expired") return "expired";
    } catch {
      // Ignore, will retry
    }
  }

  return "pending";
};

// Handle iOS PWA completion
const handleIOSPWAComplete = () => {
  clearIOSPWAPendingAction();
  setShowIOSPWAWaiting(false);
  // Continue with payment flow
  checkPreflightAndContinue();
};

// Render iOS PWA waiting screen
{showIOSPWAWaiting && (
  <IOSPWAWaiting
    intentId={iosPWAIntentId}
    onStatusCheck={checkIOSPWAStatus}
    onComplete={handleIOSPWAComplete}
    onExpired={() => {
      clearIOSPWAPendingAction();
      setShowIOSPWAWaiting(false);
      setError({ code: "INTENT_EXPIRED", message: "Session expired" });
    }}
    onManualCheck={checkIOSPWAStatus}
  />
)}
```

**Acceptance Criteria:**
- [ ] iOS PWA shows waiting screen after redirect
- [ ] Auto-polls for completion
- [ ] Manual "I approved" button works
- [ ] Handles timeout gracefully
- [ ] Continues payment flow on success

---

### 1.3 Idempotency Keys

> **Goal:** Prevent duplicate payments by using client-generated idempotency keys.
> **Backend Context:** Backend will accept `idempotencyKey` in request and return existing intent if key matches.

#### Task 1.3.1: Create Idempotency Key Generator
- **File:** `src/lib/idempotency.ts` (new)
- **Description:** Generate deterministic keys for payment requests

```typescript
// src/lib/idempotency.ts

/**
 * Generate a deterministic idempotency key for a payment.
 * Same inputs within the same minute = same key = same intent returned.
 * This prevents duplicate payments from double-clicks, retries, etc.
 */
export async function generateIdempotencyKey(params: {
  userId: string;
  birdId: string;
  birdAmount: number;
  wihngoAmount: number;
}): Promise<string> {
  // Round timestamp to nearest minute (prevents duplicates within 1 min)
  const minuteBucket = Math.floor(Date.now() / 60000);

  const data = [
    params.userId,
    params.birdId,
    params.birdAmount.toFixed(6),
    params.wihngoAmount.toFixed(6),
    minuteBucket.toString(),
  ].join("|");

  // Use Web Crypto API for SHA-256
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Return first 32 chars (128 bits, plenty unique)
  return hashHex.slice(0, 32);
}

/**
 * Get a cached idempotency key or generate a new one.
 * Caches in localStorage to survive page refreshes.
 */
export async function getOrCreateIdempotencyKey(params: {
  userId: string;
  birdId: string;
  birdAmount: number;
  wihngoAmount: number;
}): Promise<string> {
  const cacheKey = `idempotency_${params.birdId}_${params.birdAmount}_${params.wihngoAmount}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const { key, timestamp } = JSON.parse(cached);
      // Use cached key if less than 1 minute old
      if (Date.now() - timestamp < 60000) {
        return key;
      }
    } catch {
      // Invalid cache, regenerate
    }
  }

  const newKey = await generateIdempotencyKey(params);
  localStorage.setItem(cacheKey, JSON.stringify({
    key: newKey,
    timestamp: Date.now(),
  }));

  return newKey;
}

/**
 * Clear cached idempotency key after successful payment
 */
export function clearIdempotencyKey(birdId: string): void {
  // Clear all idempotency keys for this bird
  const keys = Object.keys(localStorage).filter(k => k.startsWith(`idempotency_${birdId}_`));
  keys.forEach(k => localStorage.removeItem(k));
}
```

**Acceptance Criteria:**
- [ ] Generates consistent key for same params within 1 minute
- [ ] Different key after 1 minute
- [ ] Caches key in localStorage
- [ ] Clears cache after successful payment

---

#### Task 1.3.2: Integrate Idempotency into Support Service
- **File:** `src/services/support.service.ts`
- **Description:** Include idempotency key in intent creation request

**Update createSupportIntent:**

```typescript
import { getOrCreateIdempotencyKey, clearIdempotencyKey } from "@/lib/idempotency";

export async function createSupportIntent(params: {
  birdId: string;
  birdAmount: number;
  wihngoAmount: number;
}): Promise<SupportIntentResponse> {
  const { birdId, birdAmount, wihngoAmount } = params;

  // Get user ID from auth context
  const userId = await getCurrentUserId();

  // Generate idempotency key
  const idempotencyKey = await getOrCreateIdempotencyKey({
    userId,
    birdId,
    birdAmount,
    wihngoAmount,
  });

  const response = await authenticatedFetch("/support/intents", {
    method: "POST",
    body: JSON.stringify({
      birdId,
      birdAmount,
      wihngoSupportAmount: wihngoAmount,
      currency: "USDC",
      idempotencyKey, // NEW: Include idempotency key
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create support intent");
  }

  return response.json();
}

// Call this after successful payment
export function clearPaymentCache(birdId: string): void {
  clearIdempotencyKey(birdId);
}
```

**Acceptance Criteria:**
- [ ] Idempotency key included in all intent creation requests
- [ ] Same key returned if duplicate request (backend handles)
- [ ] Cache cleared after success

---

## Phase 2: UX Improvements (Medium Priority)

### 2.1 Error Handling

#### Task 2.1.1: Create Error Mapping Service
- **File:** `src/services/error-mapping.service.ts` (new)
- **Description:** Map all possible errors to user-friendly messages

```typescript
// src/services/error-mapping.service.ts

export type PaymentErrorCode =
  | "WALLET_REJECTED"
  | "TX_REJECTED"
  | "PHANTOM_NOT_INSTALLED"
  | "USER_CANCELLED"
  | "INSUFFICIENT_BALANCE"
  | "INSUFFICIENT_GAS"
  | "NETWORK_CONGESTION"
  | "INTENT_EXPIRED"
  | "TX_FAILED"
  | "NETWORK_ERROR"
  | "BLOCKHASH_EXPIRED"
  | "UNKNOWN_ERROR";

export interface MappedError {
  code: PaymentErrorCode;
  title: string;
  message: string;
  recoverable: boolean;
  primaryAction?: {
    label: string;
    href?: string;  // If external link
    action?: "retry" | "start_over" | "close";
  };
  secondaryAction?: {
    label: string;
    action: "cancel" | "close";
  };
}

const ERROR_MAP: Record<PaymentErrorCode, Omit<MappedError, "code">> = {
  WALLET_REJECTED: {
    title: "Connection Declined",
    message: "You declined the wallet connection. Tap 'Try Again' to reconnect.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
  TX_REJECTED: {
    title: "Transaction Declined",
    message: "You declined the transaction in Phantom. No funds were sent.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
  PHANTOM_NOT_INSTALLED: {
    title: "Phantom Not Found",
    message: "Install the Phantom wallet app to continue.",
    recoverable: true,
    primaryAction: { label: "Get Phantom", href: "https://phantom.app/download" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
  USER_CANCELLED: {
    title: "Payment Cancelled",
    message: "You cancelled the payment. No funds were sent.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Close", action: "close" },
  },
  INSUFFICIENT_BALANCE: {
    title: "Insufficient USDC",
    message: "You don't have enough USDC in your wallet for this payment.",
    recoverable: false,
    primaryAction: { label: "Buy USDC", href: "https://phantom.app" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
  INSUFFICIENT_GAS: {
    title: "Need SOL for Fees",
    message: "You need a tiny amount of SOL (~$0.01) to pay network fees.",
    recoverable: false,
    primaryAction: { label: "Get SOL", href: "https://phantom.app" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
  NETWORK_CONGESTION: {
    title: "Network Busy",
    message: "The Solana network is congested. Please try again in a moment.",
    recoverable: true,
    primaryAction: { label: "Retry", action: "retry" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
  INTENT_EXPIRED: {
    title: "Session Expired",
    message: "Your payment session timed out. Please start a new payment.",
    recoverable: true,
    primaryAction: { label: "Start Over", action: "start_over" },
  },
  TX_FAILED: {
    title: "Transaction Failed",
    message: "The transaction failed on the blockchain. Please try again.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
  NETWORK_ERROR: {
    title: "Connection Error",
    message: "Unable to connect. Please check your internet and try again.",
    recoverable: true,
    primaryAction: { label: "Retry", action: "retry" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
  BLOCKHASH_EXPIRED: {
    title: "Transaction Expired",
    message: "The transaction took too long. Please try again.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
  UNKNOWN_ERROR: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "cancel" },
  },
};

/**
 * Map any error to a user-friendly MappedError
 */
export function mapError(error: unknown): MappedError {
  // Already a MappedError
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code as PaymentErrorCode;
    if (ERROR_MAP[code]) {
      return { code, ...ERROR_MAP[code] };
    }
  }

  // Standard Error object
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("rejected") || message.includes("declined")) {
      return { code: "TX_REJECTED", ...ERROR_MAP.TX_REJECTED };
    }
    if (message.includes("cancelled") || message.includes("canceled")) {
      return { code: "USER_CANCELLED", ...ERROR_MAP.USER_CANCELLED };
    }
    if (message.includes("insufficient") && message.includes("balance")) {
      return { code: "INSUFFICIENT_BALANCE", ...ERROR_MAP.INSUFFICIENT_BALANCE };
    }
    if (message.includes("network") || message.includes("fetch")) {
      return { code: "NETWORK_ERROR", ...ERROR_MAP.NETWORK_ERROR };
    }
    if (message.includes("expired") || message.includes("timeout")) {
      return { code: "INTENT_EXPIRED", ...ERROR_MAP.INTENT_EXPIRED };
    }
    if (message.includes("blockhash")) {
      return { code: "BLOCKHASH_EXPIRED", ...ERROR_MAP.BLOCKHASH_EXPIRED };
    }
  }

  // Phantom-specific error codes
  if (error && typeof error === "object" && "code" in error) {
    const phantomCode = (error as { code: number }).code;
    switch (phantomCode) {
      case 4001: // User rejected
        return { code: "TX_REJECTED", ...ERROR_MAP.TX_REJECTED };
      case 4100: // Unauthorized
        return { code: "WALLET_REJECTED", ...ERROR_MAP.WALLET_REJECTED };
    }
  }

  // Default fallback
  return { code: "UNKNOWN_ERROR", ...ERROR_MAP.UNKNOWN_ERROR };
}

/**
 * Create an error with a specific code
 */
export function createError(code: PaymentErrorCode, customMessage?: string): MappedError {
  const base = ERROR_MAP[code] || ERROR_MAP.UNKNOWN_ERROR;
  return {
    code,
    ...base,
    message: customMessage || base.message,
  };
}
```

**Acceptance Criteria:**
- [ ] All known errors mapped
- [ ] Phantom error codes handled
- [ ] Network errors detected
- [ ] Unknown errors have fallback
- [ ] Messages are user-friendly

---

#### Task 2.1.2: Create Error Display Component
- **File:** `src/components/payment/PaymentError.tsx` (new)
- **Description:** Reusable error display with actions

```tsx
// src/components/payment/PaymentError.tsx

import { MappedError } from "@/services/error-mapping.service";
import { AlertCircle, XCircle, WifiOff, Clock, Wallet } from "lucide-react";

interface PaymentErrorProps {
  error: MappedError;
  onRetry?: () => void;
  onStartOver?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  WALLET_REJECTED: Wallet,
  TX_REJECTED: XCircle,
  PHANTOM_NOT_INSTALLED: Wallet,
  INSUFFICIENT_BALANCE: Wallet,
  INSUFFICIENT_GAS: Wallet,
  NETWORK_ERROR: WifiOff,
  NETWORK_CONGESTION: WifiOff,
  INTENT_EXPIRED: Clock,
  BLOCKHASH_EXPIRED: Clock,
  DEFAULT: AlertCircle,
};

export function PaymentError({
  error,
  onRetry,
  onStartOver,
  onCancel,
  onClose,
}: PaymentErrorProps) {
  const Icon = ICONS[error.code] || ICONS.DEFAULT;

  const handlePrimaryAction = () => {
    if (error.primaryAction?.href) {
      window.open(error.primaryAction.href, "_blank");
      return;
    }

    switch (error.primaryAction?.action) {
      case "retry":
        onRetry?.();
        break;
      case "start_over":
        onStartOver?.();
        break;
      case "close":
        onClose?.();
        break;
    }
  };

  const handleSecondaryAction = () => {
    switch (error.secondaryAction?.action) {
      case "cancel":
        onCancel?.();
        break;
      case "close":
        onClose?.();
        break;
    }
  };

  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        error.recoverable ? "bg-yellow-100" : "bg-red-100"
      }`}>
        <Icon className={`w-8 h-8 ${
          error.recoverable ? "text-yellow-600" : "text-red-600"
        }`} />
      </div>

      <h3 className="text-xl font-semibold mb-2">{error.title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{error.message}</p>

      <div className="flex gap-3 w-full max-w-xs">
        {error.primaryAction && (
          <button
            onClick={handlePrimaryAction}
            className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            {error.primaryAction.label}
          </button>
        )}
        {error.secondaryAction && (
          <button
            onClick={handleSecondaryAction}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            {error.secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows appropriate icon per error type
- [ ] Primary action works (retry, external link, etc.)
- [ ] Secondary action works (cancel, close)
- [ ] Matches design system

---

#### Task 2.1.3: Integrate Error Handling into Support Flow
- **File:** `src/app/[locale]/birds/[birdId]/support/confirm/page.tsx`
- **Description:** Replace current error handling with new system

**Changes:**

```tsx
import { mapError, MappedError } from "@/services/error-mapping.service";
import { PaymentError } from "@/components/payment/PaymentError";

// Replace error state
const [paymentError, setPaymentError] = useState<MappedError | null>(null);

// Wrap async operations
const handlePayment = async () => {
  try {
    setPaymentError(null);
    // ... payment logic
  } catch (error) {
    const mapped = mapError(error);
    setPaymentError(mapped);
    console.error("Payment error:", error); // Log raw error for debugging
  }
};

// Show error UI
{paymentError && (
  <PaymentError
    error={paymentError}
    onRetry={() => {
      setPaymentError(null);
      handlePayment();
    }}
    onStartOver={() => {
      clearAllLocalState();
      setPaymentError(null);
      // Reset state
    }}
    onCancel={() => {
      router.back();
    }}
  />
)}
```

**Acceptance Criteria:**
- [ ] All errors caught and mapped
- [ ] No raw error messages shown to users
- [ ] Retry works for recoverable errors
- [ ] Raw errors logged for debugging

---

### 2.2 Retry Logic

#### Task 2.2.1: Create Retry Utility
- **File:** `src/lib/retry.ts` (new)
- **Description:** Generic retry utility with exponential backoff

```typescript
// src/lib/retry.ts

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;      // ms
  maxDelay: number;       // ms
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
      return msg.includes("network") || msg.includes("timeout") || msg.includes("congestion");
    }
    return false;
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry on failure
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

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`Retry attempt ${attempt}/${maxAttempts} in ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry config presets for different scenarios
 */
export const RETRY_PRESETS = {
  // For API calls that may fail due to network
  network: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  },
  // For blockchain operations that may need more time
  blockchain: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 15000,
  },
  // Quick retry for transient failures
  quick: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 1000,
  },
} as const;
```

**Acceptance Criteria:**
- [ ] Retries on retryable errors
- [ ] Throws immediately on non-retryable errors
- [ ] Exponential backoff works correctly
- [ ] Max delay is respected

---

#### Task 2.2.2: Apply Retry to API Calls
- **File:** `src/services/support.service.ts`
- **Description:** Wrap appropriate API calls with retry logic

```typescript
import { withRetry, RETRY_PRESETS } from "@/lib/retry";

export async function preflightCheck(params: PreflightParams): Promise<PreflightResponse> {
  return withRetry(
    () => authenticatedFetch("/support/birds/preflight", {
      method: "POST",
      body: JSON.stringify(params),
    }).then(r => r.json()),
    RETRY_PRESETS.network
  );
}

export async function createSupportIntent(params: CreateIntentParams): Promise<SupportIntentResponse> {
  return withRetry(
    () => authenticatedFetch("/support/intents", {
      method: "POST",
      body: JSON.stringify(params),
    }).then(r => r.json()),
    RETRY_PRESETS.network
  );
}

// NOTE: submitSupport should NOT have automatic retry - could cause double submissions
// Instead, rely on idempotency key if user manually retries
export async function submitSupport(
  intentId: string,
  signedTransaction: string
): Promise<SubmitSupportResponse> {
  // No retry wrapper - this is intentional
  const response = await authenticatedFetch(`/support/intents/${intentId}/submit`, {
    method: "POST",
    body: JSON.stringify({ signedTransaction }),
  });
  return response.json();
}
```

**Acceptance Criteria:**
- [ ] Preflight retries on network failure
- [ ] Intent creation retries on network failure
- [ ] Submit does NOT retry automatically (intentional)

---

### 2.3 Loading States & Progress

#### Task 2.3.1: Create Payment Progress Component
- **File:** `src/components/payment/PaymentProgress.tsx` (new)
- **Description:** Visual progress indicator for payment flow

```tsx
// src/components/payment/PaymentProgress.tsx

import { Loader2, CheckCircle, Wallet, FileCheck, Send, Clock } from "lucide-react";
import { isMobileDevice } from "@/lib/phantom/platform";

export type PaymentStep =
  | "connecting_wallet"
  | "checking_balance"
  | "creating_intent"
  | "awaiting_signature"
  | "submitting"
  | "confirming"
  | "complete";

interface PaymentProgressProps {
  currentStep: PaymentStep;
  className?: string;
}

const STEPS: Record<PaymentStep, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  mobileLabel?: string;
  progress: number;
}> = {
  connecting_wallet: {
    icon: Wallet,
    label: "Connecting wallet...",
    mobileLabel: "Approve in Phantom app",
    progress: 15,
  },
  checking_balance: {
    icon: FileCheck,
    label: "Checking balance...",
    progress: 30,
  },
  creating_intent: {
    icon: FileCheck,
    label: "Preparing payment...",
    progress: 45,
  },
  awaiting_signature: {
    icon: Wallet,
    label: "Waiting for signature...",
    mobileLabel: "Approve in Phantom, then return here",
    progress: 60,
  },
  submitting: {
    icon: Send,
    label: "Sending payment...",
    progress: 75,
  },
  confirming: {
    icon: Clock,
    label: "Confirming on Solana...",
    progress: 90,
  },
  complete: {
    icon: CheckCircle,
    label: "Payment complete!",
    progress: 100,
  },
};

export function PaymentProgress({ currentStep, className = "" }: PaymentProgressProps) {
  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isMobile = isMobileDevice();
  const label = isMobile && step.mobileLabel ? step.mobileLabel : step.label;
  const isComplete = currentStep === "complete";

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            isComplete ? "bg-green-500" : "bg-purple-600"
          }`}
          style={{ width: `${step.progress}%` }}
        />
      </div>

      {/* Icon */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        isComplete ? "bg-green-100" : "bg-purple-100"
      }`}>
        {isComplete ? (
          <Icon className="w-8 h-8 text-green-600" />
        ) : (
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        )}
      </div>

      {/* Label */}
      <p className={`text-lg font-medium ${isComplete ? "text-green-600" : "text-gray-700"}`}>
        {label}
      </p>

      {/* Substep hint */}
      {!isComplete && currentStep === "confirming" && (
        <p className="text-sm text-gray-500 mt-2">Usually 1-2 seconds</p>
      )}
      {!isComplete && currentStep === "submitting" && (
        <p className="text-sm text-gray-500 mt-2">Do not close this page</p>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] All steps have appropriate messages
- [ ] Mobile shows platform-specific hints
- [ ] Progress bar animates smoothly
- [ ] Complete state is visually distinct

---

#### Task 2.3.2: Integrate Progress into Support Flow
- **File:** `src/app/[locale]/birds/[birdId]/support/confirm/page.tsx`
- **Description:** Replace current loading states with PaymentProgress

```tsx
import { PaymentProgress, PaymentStep } from "@/components/payment/PaymentProgress";

// Add state
const [paymentStep, setPaymentStep] = useState<PaymentStep | null>(null);

// Update step during flow
const handlePayment = async () => {
  try {
    // Connect wallet if needed
    if (!isConnected) {
      setPaymentStep("connecting_wallet");
      await connectWallet();
    }

    // Check balance
    setPaymentStep("checking_balance");
    const preflight = await preflightCheck({ ... });

    // Create intent
    setPaymentStep("creating_intent");
    const intent = await createSupportIntent({ ... });

    // Sign transaction
    setPaymentStep("awaiting_signature");
    const signedTx = await signTransaction(intent.serializedTransaction);

    // Submit
    setPaymentStep("submitting");
    const result = await submitSupport(intent.intentId, signedTx);

    // Confirm
    setPaymentStep("confirming");
    await waitForConfirmation(result.solanaSignature);

    // Done
    setPaymentStep("complete");
    await sleep(1500); // Show success briefly
    router.push(`/success?signature=${result.solanaSignature}`);

  } catch (error) {
    setPaymentStep(null);
    setPaymentError(mapError(error));
  }
};

// Render
{paymentStep && !paymentError && (
  <PaymentProgress currentStep={paymentStep} />
)}
```

**Acceptance Criteria:**
- [ ] Progress shown during all async operations
- [ ] Step updates in real-time
- [ ] User always knows what's happening
- [ ] Clears on error

---

### 2.4 Timeout Handling

#### Task 2.4.1: Add Connection Timeout
- **File:** `src/hooks/use-phantom.ts`
- **Description:** Timeout wallet connection attempts

```typescript
// Add timeout utility
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

// In connect function
const connectWithExtension = async () => {
  const EXTENSION_TIMEOUT = 30000; // 30 seconds

  try {
    const result = await withTimeout(
      provider.connect(),
      EXTENSION_TIMEOUT,
      "Wallet connection timed out. Please try again."
    );
    return result;
  } catch (error) {
    if (error.message.includes("timed out")) {
      throw { code: "CONNECTION_TIMEOUT", message: error.message };
    }
    throw error;
  }
};

// For deep-link, use localStorage timestamp check (already in 1.1.4)
```

**Acceptance Criteria:**
- [ ] Extension connection times out after 30s
- [ ] Clear error message on timeout
- [ ] Deep-link timeout handled via stale state check

---

#### Task 2.4.2: Add Transaction Submission Timeout UI
- **File:** `src/components/payment/SubmissionTimeout.tsx` (new)
- **Description:** Show helpful UI when transaction takes too long

```tsx
// src/components/payment/SubmissionTimeout.tsx

import { useState, useEffect } from "react";
import { Clock, ExternalLink } from "lucide-react";
import { SOLANA_CONFIG } from "@/lib/config";

interface SubmissionTimeoutProps {
  signature?: string;
  startTime: number;
}

export function SubmissionTimeout({ signature, startTime }: SubmissionTimeoutProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const showWarning = elapsed >= 30;
  const showSolscan = elapsed >= 60 && signature;

  if (!showWarning) return null;

  const solscanUrl = signature
    ? `https://solscan.io/tx/${signature}${SOLANA_CONFIG.network === "devnet" ? "?cluster=devnet" : ""}`
    : null;

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-800">
            Taking longer than usual ({elapsed}s)
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            The network might be busy. Your payment is being processed.
          </p>
          {showSolscan && solscanUrl && (
            <a
              href={solscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-2"
            >
              Check on Solscan <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Warning shown after 30 seconds
- [ ] Solscan link shown after 60 seconds (if signature available)
- [ ] Elapsed time updates live
- [ ] User can check transaction status externally

---

## Phase 3: Polish (Lower Priority)

### 3.1 Solscan Integration

#### Task 3.1.1: Add Solscan Link to Success Page
- **File:** `src/app/[locale]/birds/[birdId]/support/success/page.tsx`
- **Description:** Show transaction link on success page

```tsx
import { ExternalLink } from "lucide-react";
import { SOLANA_CONFIG } from "@/lib/config";

// Get signature from URL params
const signature = searchParams.get("signature");

// Build Solscan URL
const solscanUrl = signature
  ? `https://solscan.io/tx/${signature}${SOLANA_CONFIG.network === "devnet" ? "?cluster=devnet" : ""}`
  : null;

// In JSX
{solscanUrl && (
  <a
    href={solscanUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mt-4"
  >
    View transaction on Solscan <ExternalLink className="w-4 h-4" />
  </a>
)}
```

**Acceptance Criteria:**
- [ ] Link shown on success page
- [ ] Correct cluster used (mainnet/devnet)
- [ ] Opens in new tab

---

### 3.2 Analytics (Optional)

#### Task 3.2.1: Add Payment Flow Events
- **File:** `src/lib/analytics.ts` (add to existing or create)
- **Description:** Track payment flow events for debugging

```typescript
// src/lib/analytics.ts

export type PaymentEvent =
  | "payment_started"
  | "wallet_connect_started"
  | "wallet_connect_success"
  | "wallet_connect_failed"
  | "preflight_success"
  | "preflight_failed"
  | "intent_created"
  | "signing_started"
  | "signing_success"
  | "signing_failed"
  | "payment_submitted"
  | "payment_confirmed"
  | "payment_failed"
  | "payment_abandoned";

interface EventData {
  birdId?: string;
  amount?: number;
  platform?: string;
  errorCode?: string;
  duration?: number;
}

export function trackPaymentEvent(event: PaymentEvent, data?: EventData): void {
  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, data);
  }

  // Send to analytics service in production
  // Example: posthog.capture(event, data);
  // Example: mixpanel.track(event, data);
}
```

**Acceptance Criteria:**
- [ ] All events fire at correct times
- [ ] Events include relevant metadata
- [ ] No PII in event data
- [ ] Easy to integrate with analytics service

---

## Implementation Order

### Sprint 1: Session Recovery (Critical)
1. Task 1.1.1 - Session recovery service
2. Task 1.1.2 - Recovery modal
3. Task 1.1.3 - Integrate into support page
4. Task 1.1.4 - Add to usePhantom hook

### Sprint 2: iOS PWA Handling (Critical)
1. Task 1.2.1 - iOS PWA detection
2. Task 1.2.2 - iOS PWA waiting component
3. Task 1.2.3 - Update wallet connect service
4. Task 1.2.4 - Integrate into support page

### Sprint 3: Idempotency & Error Handling
1. Task 1.3.1 - Idempotency key generator
2. Task 1.3.2 - Integrate into support service
3. Task 2.1.1 - Error mapping service
4. Task 2.1.2 - Error display component
5. Task 2.1.3 - Integrate error handling

### Sprint 4: UX Polish
1. Task 2.2.1 - Retry utility
2. Task 2.2.2 - Apply retry to API calls
3. Task 2.3.1 - Payment progress component
4. Task 2.3.2 - Integrate progress
5. Task 2.4.1 - Connection timeout
6. Task 2.4.2 - Transaction timeout UI

### Sprint 5: Final Polish
1. Task 3.1.1 - Solscan integration
2. Task 3.2.1 - Analytics events

---

## Files to Create

| File | Priority | Description |
|------|----------|-------------|
| `src/services/session-recovery.service.ts` | High | Session recovery logic |
| `src/services/error-mapping.service.ts` | Medium | Error code to message mapping |
| `src/components/payment/RecoveryModal.tsx` | High | Recovery UI |
| `src/components/phantom/IOSPWAWaiting.tsx` | High | iOS PWA waiting UI |
| `src/components/payment/PaymentError.tsx` | Medium | Error display |
| `src/components/payment/PaymentProgress.tsx` | Medium | Progress indicator |
| `src/components/payment/SubmissionTimeout.tsx` | Medium | Timeout warning |
| `src/lib/idempotency.ts` | High | Idempotency key generation |
| `src/lib/retry.ts` | Medium | Retry utility |

## Files to Modify

| File | Priority | Changes |
|------|----------|---------|
| `src/hooks/use-phantom.ts` | High | Stale state check, timestamps |
| `src/services/wallet-connect.service.ts` | High | iOS PWA handling |
| `src/services/support.service.ts` | High | Idempotency keys, retry |
| `src/lib/phantom/platform.ts` | High | iOS PWA detection |
| `src/app/[locale]/birds/[birdId]/support/confirm/page.tsx` | High | Recovery, progress, errors, iOS PWA |
| `src/app/[locale]/birds/[birdId]/support/success/page.tsx` | Low | Solscan link |

---

## Testing Checklist

### Happy Path
- [ ] Desktop Chrome - Full payment flow
- [ ] Desktop Safari - Full payment flow
- [ ] Android Chrome - Full payment flow
- [ ] Android PWA - Full payment flow
- [ ] iOS Safari - Full payment flow
- [ ] iOS PWA - Full payment flow (with manual return)

### Error Scenarios
- [ ] User rejects wallet connection
- [ ] User rejects transaction
- [ ] Insufficient USDC balance
- [ ] Insufficient SOL for gas
- [ ] Network error during preflight
- [ ] Network error during submit
- [ ] Intent expires before signing

### Recovery Scenarios
- [ ] User closes browser during connection (desktop)
- [ ] App killed during Phantom redirect (mobile)
- [ ] User returns to app after Phantom (iOS PWA)
- [ ] Resume incomplete payment from localStorage
- [ ] Double-click prevention (idempotency)

### Edge Cases
- [ ] Double-click submit button
- [ ] Refresh page during payment
- [ ] Back button during payment
- [ ] Retry after failed payment
