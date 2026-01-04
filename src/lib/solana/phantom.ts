/**
 * Phantom Wallet Integration
 *
 * Handles both desktop (browser extension) and mobile (deep linking) flows.
 * Constructs USDC SPL token transfers with memo-based reference binding.
 *
 * Security:
 * - Frontend constructs transaction, Phantom signs
 * - Backend verifies on-chain (amount, destination, mint, memo reference)
 * - No private keys client-side
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Commitment,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { getPaymentConfig } from '@/services/payment.service';
import type { PaymentConfig } from '@/types/payment';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** USDC has 6 decimal places */
const USDC_DECIMALS = 6;

/** Memo program for reference binding */
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// ─────────────────────────────────────────────────────────────
// Backend Config (fetched from /api/payments/config)
// ─────────────────────────────────────────────────────────────

/** Cached payment config from backend */
let cachedConfig: PaymentConfig | null = null;
let configFetchPromise: Promise<PaymentConfig> | null = null;

/**
 * Get payment config from backend (cached)
 * This ensures frontend uses the same network/wallet as backend
 */
export async function getSolanaConfig(): Promise<PaymentConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // If a fetch is in progress, wait for it
  if (configFetchPromise) {
    return configFetchPromise;
  }

  // Fetch config from backend
  configFetchPromise = getPaymentConfig()
    .then((config) => {
      cachedConfig = config;
      configFetchPromise = null;
      console.log('[Solana] Config loaded from backend:', {
        network: config.network,
        rpcUrl: config.rpcUrl,
        usdcMint: config.usdcMint,
        platformWallet: config.platformWallet,
      });
      return config;
    })
    .catch((err) => {
      configFetchPromise = null;
      console.error('[Solana] Failed to fetch config from backend:', err);
      throw new Error('Failed to load payment configuration. Please try again.');
    });

  return configFetchPromise;
}

/**
 * Clear cached config (useful for testing or after errors)
 */
export function clearSolanaConfigCache(): void {
  cachedConfig = null;
  configFetchPromise = null;
}

// ─────────────────────────────────────────────────────────────
// Phantom Wallet Type (local to this module)
// ─────────────────────────────────────────────────────────────

interface PhantomWallet {
  isPhantom: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (
    transaction: Transaction,
    opts?: { skipPreflight?: boolean }
  ) => Promise<{ signature: string }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  on: (event: string, callback: (args: unknown) => void) => void;
  off: (event: string, callback: (args: unknown) => void) => void;
}

// Window interface augmentation is in hooks/use-phantom.ts

// ─────────────────────────────────────────────────────────────
// Environment Detection
// ─────────────────────────────────────────────────────────────

/**
 * Check if running on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Check if Phantom browser extension is available
 */
export function isPhantomInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const provider = getPhantomProvider();
  return provider?.isPhantom === true;
}

/**
 * Get Phantom provider from window
 */
export function getPhantomProvider(): PhantomWallet | null {
  if (typeof window === 'undefined') return null;

  // Phantom injects as window.phantom.solana or window.solana
  // Cast to PhantomWallet which has the full interface we need
  const provider = (window.phantom?.solana || window.solana) as PhantomWallet | undefined;

  if (provider?.isPhantom) {
    return provider;
  }

  return null;
}

/**
 * Check if we're in Phantom's in-app browser
 */
export function isPhantomBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return isPhantomInstalled() && isMobileDevice();
}

// ─────────────────────────────────────────────────────────────
// Wallet Connection
// ─────────────────────────────────────────────────────────────

export interface WalletConnectionResult {
  success: boolean;
  publicKey?: string;
  error?: string;
}

/**
 * Connect to Phantom wallet (desktop extension)
 */
export async function connectPhantomDesktop(): Promise<WalletConnectionResult> {
  const provider = getPhantomProvider();

  if (!provider) {
    return {
      success: false,
      error: 'Phantom wallet not installed. Please install from phantom.app',
    };
  }

  try {
    const response = await provider.connect();
    return {
      success: true,
      publicKey: response.publicKey.toString(),
    };
  } catch (err) {
    const error = err as Error;

    // User rejected connection
    if (error.message?.includes('User rejected')) {
      return {
        success: false,
        error: 'Connection cancelled. Please try again.',
      };
    }

    return {
      success: false,
      error: 'Failed to connect wallet. Please try again.',
    };
  }
}

/**
 * Disconnect from Phantom wallet
 */
export async function disconnectPhantom(): Promise<void> {
  const provider = getPhantomProvider();
  if (provider?.isConnected) {
    await provider.disconnect();
  }
}

/**
 * Get currently connected wallet address
 */
export function getConnectedWallet(): string | null {
  const provider = getPhantomProvider();
  if (provider?.isConnected && provider.publicKey) {
    return provider.publicKey.toString();
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Balance Checking
// ─────────────────────────────────────────────────────────────

export interface BalanceCheckResult {
  hasEnoughUsdc: boolean;
  hasEnoughSol: boolean;
  /** USDC balance in cents */
  usdcBalanceCents: number;
  solBalance: number;
  /** Required amount in cents */
  requiredCents: number;
  requiredSol: number;
  error?: string;
}

/**
 * Check if wallet has enough USDC and SOL for a transaction
 * @param walletAddress - Wallet public key
 * @param amountCents - Required amount in cents
 */
export async function checkBalanceForPayment(
  walletAddress: string,
  amountCents: number
): Promise<BalanceCheckResult> {
  const REQUIRED_SOL_FOR_FEES = 0.005;
  const requiredUsdc = amountCents / 100;

  try {
    const config = await getSolanaConfig();

    const connection = new Connection(
      config.rpcUrl,
      'processed' as Commitment
    );

    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(config.usdcMint);

    // Get SOL balance
    const solLamports = await connection.getBalance(walletPubkey);
    const solBalance = solLamports / 1e9;

    // Get USDC balance (returns in USDC, convert to cents)
    let usdcBalanceUsdc = 0;
    try {
      const ata = await getAssociatedTokenAddress(
        mintPubkey,
        walletPubkey,
        false,
        TOKEN_PROGRAM_ID
      );
      const tokenAccount = await connection.getTokenAccountBalance(ata);
      usdcBalanceUsdc = tokenAccount.value.uiAmount || 0;
    } catch {
      usdcBalanceUsdc = 0;
    }

    // Convert USDC balance to cents for return
    const usdcBalanceCents = Math.round(usdcBalanceUsdc * 100);

    return {
      hasEnoughUsdc: usdcBalanceUsdc >= requiredUsdc,
      hasEnoughSol: solBalance >= REQUIRED_SOL_FOR_FEES,
      usdcBalanceCents,
      solBalance,
      requiredCents: amountCents,
      requiredSol: REQUIRED_SOL_FOR_FEES,
    };
  } catch (err) {
    console.error('[checkBalanceForPayment] Error:', err);
    return {
      hasEnoughUsdc: false,
      hasEnoughSol: false,
      usdcBalanceCents: 0,
      solBalance: 0,
      requiredCents: amountCents,
      requiredSol: REQUIRED_SOL_FOR_FEES,
      error: 'Failed to check balance. Please try again.',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Transaction Construction
// ─────────────────────────────────────────────────────────────

export interface TransactionParams {
  fromWallet: string;
  toWallet: string;
  amountUsdc: number;
  paymentId: string;
}

/**
 * Parameters for dual transfer (bird support + platform support)
 * All amounts in cents (USD cents) - converted to USDC only for transaction
 */
export interface DualTransferParams {
  fromWallet: string;
  /** Bird's wallet for bird support */
  birdWallet: string;
  /** Platform wallet for Wihngo support (from config) */
  platformWallet: string;
  /** Bird support amount in cents */
  birdAmountCents: number;
  /** Platform support amount in cents (optional) */
  platformAmountCents?: number;
  paymentId: string;
}

export interface BuiltTransaction {
  transaction: Transaction;
  connection: Connection;
}

/**
 * Build USDC transfer transaction with memo reference binding
 */
export async function buildUsdcTransferTransaction(
  params: TransactionParams
): Promise<BuiltTransaction> {
  const {
    fromWallet,
    toWallet,
    amountUsdc,
    paymentId,
  } = params;

  // Validate amount
  if (typeof amountUsdc !== 'number' || isNaN(amountUsdc) || amountUsdc <= 0) {
    throw new Error(`Invalid payment amount: ${amountUsdc}. Amount must be a positive number.`);
  }

  const config = await getSolanaConfig();

  const connection = new Connection(
    config.rpcUrl,
    'processed' as Commitment
  );

  const fromPubkey = new PublicKey(fromWallet);
  const toPubkey = new PublicKey(toWallet);
  const mintPubkey = new PublicKey(config.usdcMint);

  // Get Associated Token Accounts (ATAs)
  const fromATA = await getAssociatedTokenAddress(
    mintPubkey,
    fromPubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  const toATA = await getAssociatedTokenAddress(
    mintPubkey,
    toPubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  // Calculate amount in smallest units (USDC has 6 decimals)
  const amountInSmallestUnits = BigInt(Math.round(amountUsdc * 10 ** USDC_DECIMALS));

  console.log('[buildUsdcTransferTransaction] Pre-flight checks:');
  console.log('  Network:', config.network);
  console.log('  From wallet:', fromPubkey.toBase58());
  console.log('  To wallet:', toPubkey.toBase58());
  console.log('  Amount:', amountUsdc, 'USDC');

  // Check SOL balance for fees
  const MIN_SOL_FOR_FEES = 5000000; // 0.005 SOL
  try {
    const solBalance = await connection.getBalance(fromPubkey);
    if (solBalance < MIN_SOL_FOR_FEES) {
      const error = new Error(`Insufficient SOL for transaction fees. Need ~0.005 SOL.`);
      (error as Error & { code: string }).code = 'INSUFFICIENT_SOL';
      throw error;
    }
  } catch (e) {
    if ((e as Error & { code?: string }).code === 'INSUFFICIENT_SOL') throw e;
    console.warn('Could not check SOL balance:', e);
  }

  // Check source USDC account
  try {
    const fromAccount = await getAccount(connection, fromATA);
    if (Number(fromAccount.amount) < amountInSmallestUnits) {
      const error = new Error(`Insufficient USDC balance.`);
      (error as Error & { code: string }).code = 'INSUFFICIENT_USDC';
      throw error;
    }
  } catch (e) {
    if ((e as Error & { code?: string }).code === 'INSUFFICIENT_USDC') throw e;
    const error = new Error('No USDC account found. Please add USDC to your wallet first.');
    (error as Error & { code: string }).code = 'NO_USDC_ACCOUNT';
    throw error;
  }

  // Create transaction
  const transaction = new Transaction();

  // Check if destination ATA exists
  try {
    await getAccount(connection, toATA);
  } catch {
    // Create destination ATA if needed
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromPubkey,
        toATA,
        toPubkey,
        mintPubkey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Add USDC transfer instruction
  transaction.add(
    createTransferCheckedInstruction(
      fromATA,
      mintPubkey,
      toATA,
      fromPubkey,
      amountInSmallestUnits,
      USDC_DECIMALS
    )
  );

  // Add memo instruction for reference binding
  // Format: "wihngo:{paymentId}"
  const memoData = `wihngo:${paymentId}`;
  transaction.add(
    new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoData, 'utf-8'),
    })
  );

  // Set transaction metadata
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = fromPubkey;

  return { transaction, connection };
}

/**
 * Helper to add USDC transfer instruction to a transaction
 */
async function addUsdcTransferInstruction(
  transaction: Transaction,
  connection: Connection,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  mintPubkey: PublicKey,
  amountUsdc: number
): Promise<void> {
  const fromATA = await getAssociatedTokenAddress(
    mintPubkey,
    fromPubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  const toATA = await getAssociatedTokenAddress(
    mintPubkey,
    toPubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  // Check if destination ATA exists, create if not
  try {
    await getAccount(connection, toATA);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromPubkey,
        toATA,
        toPubkey,
        mintPubkey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  const amountInSmallestUnits = BigInt(Math.round(amountUsdc * 10 ** USDC_DECIMALS));

  transaction.add(
    createTransferCheckedInstruction(
      fromATA,
      mintPubkey,
      toATA,
      fromPubkey,
      amountInSmallestUnits,
      USDC_DECIMALS
    )
  );
}

/**
 * Build dual USDC transfer transaction (bird support + optional platform support)
 *
 * Creates a single transaction with one or two transfer instructions:
 * 1. Transfer to bird's wallet (bird support)
 * 2. Transfer to platform wallet (Wihngo support) - if platformAmountCents > 0
 *
 * All amounts are in cents - converted to USDC (cents/100) for the transaction.
 * Includes memo with paymentId for backend verification.
 */
export async function buildDualTransferTransaction(
  params: DualTransferParams
): Promise<BuiltTransaction> {
  const {
    fromWallet,
    birdWallet,
    platformWallet,
    birdAmountCents,
    platformAmountCents,
    paymentId,
  } = params;

  // Calculate total amount in cents
  const totalAmountCents = birdAmountCents + (platformAmountCents || 0);

  // Validate amounts (in cents)
  if (typeof birdAmountCents !== 'number' || isNaN(birdAmountCents) || birdAmountCents <= 0) {
    throw new Error(`Invalid bird support amount: ${birdAmountCents} cents. Amount must be positive.`);
  }

  if (platformAmountCents !== undefined && platformAmountCents < 0) {
    throw new Error(`Invalid platform support amount: ${platformAmountCents} cents. Amount cannot be negative.`);
  }

  // Convert cents to USDC for display/logging (1 USDC = 100 cents)
  const birdAmountUsdc = birdAmountCents / 100;
  const platformAmountUsdc = platformAmountCents ? platformAmountCents / 100 : 0;
  const totalAmountUsdc = totalAmountCents / 100;

  const config = await getSolanaConfig();

  const connection = new Connection(
    config.rpcUrl,
    'processed' as Commitment
  );

  const fromPubkey = new PublicKey(fromWallet);
  const birdPubkey = new PublicKey(birdWallet);
  const platformPubkey = new PublicKey(platformWallet);
  const mintPubkey = new PublicKey(config.usdcMint);

  console.log('[buildDualTransferTransaction] Pre-flight checks:');
  console.log('  Network:', config.network);
  console.log('  From wallet:', fromPubkey.toBase58());
  console.log('  Bird wallet:', birdPubkey.toBase58());
  console.log('  Platform wallet:', platformPubkey.toBase58());
  console.log('  Bird amount:', birdAmountCents, 'cents ($' + birdAmountUsdc.toFixed(2) + ')');
  console.log('  Platform amount:', platformAmountCents || 0, 'cents ($' + platformAmountUsdc.toFixed(2) + ')');
  console.log('  Total amount:', totalAmountCents, 'cents ($' + totalAmountUsdc.toFixed(2) + ')');

  // Check SOL balance for fees (slightly higher for dual transfer)
  const MIN_SOL_FOR_FEES = 7000000; // 0.007 SOL for potential 2 ATA creations
  try {
    const solBalance = await connection.getBalance(fromPubkey);
    if (solBalance < MIN_SOL_FOR_FEES) {
      const error = new Error(`Insufficient SOL for transaction fees. Need ~0.007 SOL.`);
      (error as Error & { code: string }).code = 'INSUFFICIENT_SOL';
      throw error;
    }
  } catch (e) {
    if ((e as Error & { code?: string }).code === 'INSUFFICIENT_SOL') throw e;
    console.warn('Could not check SOL balance:', e);
  }

  // Check source USDC account has enough for total
  const fromATA = await getAssociatedTokenAddress(
    mintPubkey,
    fromPubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  const totalInSmallestUnits = BigInt(Math.round(totalAmountUsdc * 10 ** USDC_DECIMALS));

  try {
    const fromAccount = await getAccount(connection, fromATA);
    if (Number(fromAccount.amount) < totalInSmallestUnits) {
      const balance = Number(fromAccount.amount) / 10 ** USDC_DECIMALS;
      const error = new Error(`Insufficient USDC balance. Have ${balance.toFixed(2)}, need ${totalAmountUsdc.toFixed(2)} USDC.`);
      (error as Error & { code: string }).code = 'INSUFFICIENT_USDC';
      throw error;
    }
  } catch (e) {
    if ((e as Error & { code?: string }).code === 'INSUFFICIENT_USDC') throw e;
    const error = new Error('No USDC account found. Please add USDC to your wallet first.');
    (error as Error & { code: string }).code = 'NO_USDC_ACCOUNT';
    throw error;
  }

  // Create transaction
  const transaction = new Transaction();

  // 1. Add bird support transfer
  await addUsdcTransferInstruction(
    transaction,
    connection,
    fromPubkey,
    birdPubkey,
    mintPubkey,
    birdAmountUsdc
  );
  console.log('  Added bird support transfer instruction');

  // 2. Add platform support transfer (if amount > 0)
  if (platformAmountCents && platformAmountCents > 0) {
    await addUsdcTransferInstruction(
      transaction,
      connection,
      fromPubkey,
      platformPubkey,
      mintPubkey,
      platformAmountUsdc
    );
    console.log('  Added platform support transfer instruction');
  }

  // 3. Add memo instruction for reference binding
  const memoData = `wihngo:${paymentId}`;
  transaction.add(
    new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoData, 'utf-8'),
    })
  );

  // Set transaction metadata
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = fromPubkey;

  console.log('[buildDualTransferTransaction] Transaction built with', transaction.instructions.length, 'instructions');

  return { transaction, connection };
}

// ─────────────────────────────────────────────────────────────
// Desktop Transaction Execution
// ─────────────────────────────────────────────────────────────

export type PhantomErrorCode =
  | 'USER_REJECTED'
  | 'INSUFFICIENT_USDC'
  | 'INSUFFICIENT_SOL'
  | 'NO_USDC_ACCOUNT'
  | 'NETWORK_ERROR'
  | 'BLOCKHASH_EXPIRED'
  | 'SIMULATION_FAILED'
  | 'UNKNOWN';

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  errorCode?: PhantomErrorCode;
}

/**
 * Result from signing a transaction (without sending)
 */
export interface SignTransactionResult {
  success: boolean;
  /** Base64-encoded signed transaction */
  signedTransaction?: string;
  error?: string;
  errorCode?: PhantomErrorCode;
}

/**
 * Sign a serialized transaction via Phantom desktop extension (without sending)
 * Used when backend builds the transaction and handles submission.
 *
 * @param serializedTransaction - Base64-encoded unsigned transaction from backend
 * @returns Signed transaction as base64 string
 */
export async function signSerializedTransaction(
  serializedTransaction: string
): Promise<SignTransactionResult> {
  const provider = getPhantomProvider();

  if (!provider) {
    return {
      success: false,
      error: 'Phantom wallet not available',
      errorCode: 'UNKNOWN',
    };
  }

  if (!provider.isConnected) {
    return {
      success: false,
      error: 'Wallet not connected',
      errorCode: 'UNKNOWN',
    };
  }

  try {
    // Decode base64 to buffer
    const transactionBuffer = Buffer.from(serializedTransaction, 'base64');

    // Deserialize to Transaction object
    const transaction = Transaction.from(transactionBuffer);

    console.log('[signSerializedTransaction] Signing transaction...');

    // Sign the transaction (Phantom adds the signature)
    const signedTransaction = await provider.signTransaction(transaction);

    // Serialize back to base64
    const signedBuffer = signedTransaction.serialize({
      requireAllSignatures: true,
      verifySignatures: true,
    });
    const signedBase64 = signedBuffer.toString('base64');

    console.log('[signSerializedTransaction] Transaction signed successfully');

    return {
      success: true,
      signedTransaction: signedBase64,
    };
  } catch (err) {
    console.error('[signSerializedTransaction] Error:', err);
    const result = categorizePhantomError(err);
    return {
      success: false,
      error: result.error,
      errorCode: result.errorCode,
    };
  }
}

/**
 * Sign and send transaction via Phantom desktop extension
 */
export async function signAndSendTransactionDesktop(
  transaction: Transaction,
  connection?: Connection
): Promise<TransactionResult> {
  const provider = getPhantomProvider();

  if (!provider) {
    return {
      success: false,
      error: 'Phantom wallet not available',
      errorCode: 'UNKNOWN',
    };
  }

  if (!provider.isConnected) {
    return {
      success: false,
      error: 'Wallet not connected',
      errorCode: 'UNKNOWN',
    };
  }

  try {
    const { signature } = await provider.signAndSendTransaction(transaction, {
      skipPreflight: false,
    });

    console.log('[signAndSendTransactionDesktop] Submitted:', signature);

    // Wait for confirmation if connection provided
    if (connection) {
      try {
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash: transaction.recentBlockhash!,
            lastValidBlockHeight: transaction.lastValidBlockHeight!,
          },
          'confirmed'
        );

        if (confirmation.value.err) {
          return {
            success: false,
            error: 'Transaction failed on-chain. Please try again.',
            errorCode: 'SIMULATION_FAILED',
          };
        }
      } catch (confirmErr) {
        console.warn('[signAndSendTransactionDesktop] Confirmation wait failed:', confirmErr);
      }
    }

    return {
      success: true,
      signature,
    };
  } catch (err) {
    console.error('[signAndSendTransactionDesktop] Error:', err);
    return categorizePhantomError(err);
  }
}

/**
 * Categorize Phantom errors into user-friendly messages
 */
function categorizePhantomError(err: unknown): TransactionResult {
  const error = err as Error & { code?: number; message?: string; logs?: string[] };
  const message = error.message?.toLowerCase() || '';
  const logs = error.logs?.join(' ').toLowerCase() || '';
  const combined = `${message} ${logs}`;

  if (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('cancelled') ||
    error.code === 4001
  ) {
    return {
      success: false,
      error: 'Transaction cancelled. Please try again when ready.',
      errorCode: 'USER_REJECTED',
    };
  }

  if (
    combined.includes('account not found') ||
    combined.includes('0x1') ||
    combined.includes('accountnotfound')
  ) {
    return {
      success: false,
      error: 'No USDC account found. Please add USDC to your wallet first.',
      errorCode: 'NO_USDC_ACCOUNT',
    };
  }

  if (
    combined.includes('insufficient funds') ||
    combined.includes('insufficient token') ||
    combined.includes('0x6')
  ) {
    return {
      success: false,
      error: 'Insufficient USDC balance. Please add funds to your wallet.',
      errorCode: 'INSUFFICIENT_USDC',
    };
  }

  if (
    combined.includes('insufficient lamports') ||
    combined.includes('insufficient sol') ||
    combined.includes('0x0')
  ) {
    return {
      success: false,
      error: 'Insufficient SOL for transaction fees. Please add ~0.01 SOL to your wallet.',
      errorCode: 'INSUFFICIENT_SOL',
    };
  }

  if (
    combined.includes('blockhash') ||
    combined.includes('expired') ||
    combined.includes('block height exceeded')
  ) {
    return {
      success: false,
      error: 'Transaction expired. Please try again.',
      errorCode: 'BLOCKHASH_EXPIRED',
    };
  }

  if (
    combined.includes('simulation failed') ||
    combined.includes('preflight')
  ) {
    return {
      success: false,
      error: 'Transaction simulation failed. Please check your balance and try again.',
      errorCode: 'SIMULATION_FAILED',
    };
  }

  if (
    combined.includes('network') ||
    combined.includes('timeout') ||
    combined.includes('connection')
  ) {
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
      errorCode: 'NETWORK_ERROR',
    };
  }

  return {
    success: false,
    error: `Transaction failed: ${error.message || 'Unknown error'}`,
    errorCode: 'UNKNOWN',
  };
}

// ─────────────────────────────────────────────────────────────
// Mobile Deep Linking
// ─────────────────────────────────────────────────────────────

const PHANTOM_DEEP_LINK = {
  connect: 'https://phantom.app/ul/v1/connect',
  signAndSendTransaction: 'https://phantom.app/ul/v1/signAndSendTransaction',
} as const;

function getRedirectUrl(path: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}${path}`;
}

export interface MobileTransactionParams {
  transaction: Transaction;
  redirectPath: string;
  session?: string;
}

/**
 * Generate Phantom transaction deep link for mobile
 */
export function buildTransactionDeepLink(params: MobileTransactionParams & { cluster?: string }): string {
  const { transaction, redirectPath, cluster = 'mainnet-beta' } = params;

  const redirectUrl = getRedirectUrl(redirectPath);
  const phantomCluster = cluster === 'mainnet' ? 'mainnet-beta' : cluster;

  const serializedTx = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const base58Tx = bs58.encode(serializedTx);

  const searchParams = new URLSearchParams({
    transaction: base58Tx,
    redirect_link: redirectUrl,
    cluster: phantomCluster,
  });

  return `${PHANTOM_DEEP_LINK.signAndSendTransaction}?${searchParams.toString()}`;
}

/**
 * Generate Phantom transaction deep link (async version)
 */
export async function buildTransactionDeepLinkAsync(params: MobileTransactionParams): Promise<string> {
  const config = await getSolanaConfig();
  const cluster = config.network === 'mainnet' ? 'mainnet-beta' : 'devnet';
  return buildTransactionDeepLink({ ...params, cluster });
}

// ─────────────────────────────────────────────────────────────
// Unified Payment Flow
// ─────────────────────────────────────────────────────────────

export interface PaymentExecutionParams {
  fromWallet: string;
  toWallet: string;
  amountUsdc: number;
  paymentId: string;
  redirectPath: string;
}

/**
 * Parameters for dual payment execution (bird support + platform support)
 * All amounts in cents - converted to USDC only for transaction
 */
export interface DualPaymentExecutionParams {
  fromWallet: string;
  /** Bird's wallet for bird support */
  birdWallet: string;
  /** Bird support amount in cents */
  birdAmountCents: number;
  /** Platform support amount in cents (optional) */
  platformAmountCents?: number;
  paymentId: string;
  redirectPath: string;
}

export interface PaymentExecutionResult {
  success: boolean;
  signature?: string;
  deepLinkUrl?: string;
  error?: string;
  errorCode?: PhantomErrorCode;
}

/**
 * Execute payment - handles both desktop and mobile flows
 */
export async function executePayment(
  params: PaymentExecutionParams
): Promise<PaymentExecutionResult> {
  const { fromWallet, toWallet, amountUsdc, paymentId, redirectPath } = params;

  try {
    const { transaction, connection } = await buildUsdcTransferTransaction({
      fromWallet,
      toWallet,
      amountUsdc,
      paymentId,
    });

    // Check if mobile
    if (isMobileDevice() && !isPhantomBrowser()) {
      const deepLinkUrl = await buildTransactionDeepLinkAsync({
        transaction,
        redirectPath,
        session: paymentId,
      });

      return {
        success: true,
        deepLinkUrl,
      };
    }

    // Desktop: Sign and send directly
    const result = await signAndSendTransactionDesktop(transaction, connection);

    return {
      success: result.success,
      signature: result.signature,
      error: result.error,
      errorCode: result.errorCode,
    };
  } catch (err) {
    const error = err as Error & { code?: string };
    console.error('[executePayment] Error:', error);

    if (error.code === 'INSUFFICIENT_USDC') {
      return { success: false, error: error.message, errorCode: 'INSUFFICIENT_USDC' };
    }

    if (error.code === 'NO_USDC_ACCOUNT') {
      return { success: false, error: error.message, errorCode: 'NO_USDC_ACCOUNT' };
    }

    if (error.code === 'INSUFFICIENT_SOL') {
      return { success: false, error: error.message, errorCode: 'INSUFFICIENT_SOL' };
    }

    return {
      success: false,
      error: error.message || 'Failed to prepare transaction. Please try again.',
      errorCode: 'UNKNOWN',
    };
  }
}

/**
 * Execute dual payment (bird support + optional platform support)
 *
 * Creates a single transaction with one or two transfers:
 * 1. Transfer to bird's wallet (bird support)
 * 2. Transfer to platform wallet (Wihngo support) - if platformAmountCents > 0
 *
 * All amounts in cents - converted to USDC only for transaction.
 * Handles both desktop and mobile flows.
 */
export async function executeDualPayment(
  params: DualPaymentExecutionParams
): Promise<PaymentExecutionResult> {
  const {
    fromWallet,
    birdWallet,
    birdAmountCents,
    platformAmountCents,
    paymentId,
    redirectPath,
  } = params;

  try {
    // Get platform wallet from config
    const config = await getSolanaConfig();

    const { transaction, connection } = await buildDualTransferTransaction({
      fromWallet,
      birdWallet,
      platformWallet: config.platformWallet,
      birdAmountCents,
      platformAmountCents,
      paymentId,
    });

    // Check if mobile
    if (isMobileDevice() && !isPhantomBrowser()) {
      const deepLinkUrl = await buildTransactionDeepLinkAsync({
        transaction,
        redirectPath,
        session: paymentId,
      });

      return {
        success: true,
        deepLinkUrl,
      };
    }

    // Desktop: Sign and send directly
    const result = await signAndSendTransactionDesktop(transaction, connection);

    return {
      success: result.success,
      signature: result.signature,
      error: result.error,
      errorCode: result.errorCode,
    };
  } catch (err) {
    const error = err as Error & { code?: string };
    console.error('[executeDualPayment] Error:', error);

    if (error.code === 'INSUFFICIENT_USDC') {
      return { success: false, error: error.message, errorCode: 'INSUFFICIENT_USDC' };
    }

    if (error.code === 'NO_USDC_ACCOUNT') {
      return { success: false, error: error.message, errorCode: 'NO_USDC_ACCOUNT' };
    }

    if (error.code === 'INSUFFICIENT_SOL') {
      return { success: false, error: error.message, errorCode: 'INSUFFICIENT_SOL' };
    }

    return {
      success: false,
      error: error.message || 'Failed to prepare transaction. Please try again.',
      errorCode: 'UNKNOWN',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Format wallet address for display (truncated)
 */
export function formatWalletAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format USDC amount for display
 */
export function formatUsdc(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format cents amount for display as USD
 * @param cents - Amount in cents (e.g., 999 = $9.99)
 */
export function formatCentsAsUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export { USDC_DECIMALS };
