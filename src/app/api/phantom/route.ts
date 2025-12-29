import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";

// In-memory store for pending connections (in production, use Redis or database)
// Key: connection_id, Value: { secretKey, publicKey, createdAt }
const pendingConnections = new Map<string, {
  secretKey: string;
  publicKey: string;
  createdAt: number;
}>();

// Clean up old entries (older than 10 minutes)
function cleanupOldEntries() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes

  for (const [id, entry] of pendingConnections.entries()) {
    if (now - entry.createdAt > maxAge) {
      pendingConnections.delete(id);
    }
  }
}

// Generate a random connection ID
function generateConnectionId(): string {
  const bytes = nacl.randomBytes(16);
  return bs58.encode(bytes);
}

// POST /api/phantom - Initialize connection (generate keypair)
// POST /api/phantom?action=decrypt - Decrypt Phantom response
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "decrypt") {
    return handleDecrypt(request);
  }

  return handleInit();
}

// GET /api/phantom?connection_id=xxx - Check if connection exists
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const connectionId = url.searchParams.get("connection_id");

  if (!connectionId) {
    return NextResponse.json({ error: "Missing connection_id" }, { status: 400 });
  }

  const entry = pendingConnections.get(connectionId);
  if (!entry) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    publicKey: entry.publicKey
  });
}

// Initialize a new connection - generate keypair and store it
function handleInit() {
  cleanupOldEntries();

  // Generate X25519 keypair for encryption
  const keyPair = nacl.box.keyPair();
  const connectionId = generateConnectionId();

  // Store the keypair
  pendingConnections.set(connectionId, {
    secretKey: bs58.encode(keyPair.secretKey),
    publicKey: bs58.encode(keyPair.publicKey),
    createdAt: Date.now(),
  });

  return NextResponse.json({
    connectionId,
    dappPublicKey: bs58.encode(keyPair.publicKey),
  });
}

// Decrypt Phantom response using stored keypair
async function handleDecrypt(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      connectionId,
      phantomEncryptionPublicKey,
      data,
      nonce
    } = body;

    if (!connectionId || !phantomEncryptionPublicKey || !data || !nonce) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get stored keypair
    const entry = pendingConnections.get(connectionId);
    if (!entry) {
      return NextResponse.json(
        { error: "Connection not found or expired" },
        { status: 404 }
      );
    }

    // Decrypt the response
    const dappSecretKey = bs58.decode(entry.secretKey);
    const phantomPubKeyBytes = bs58.decode(phantomEncryptionPublicKey);
    const encryptedData = bs58.decode(data);
    const nonceBytes = bs58.decode(nonce);

    // Derive shared secret using X25519
    const sharedSecret = nacl.box.before(phantomPubKeyBytes, dappSecretKey);

    // Decrypt the data
    const decryptedData = nacl.box.open.after(encryptedData, nonceBytes, sharedSecret);
    if (!decryptedData) {
      return NextResponse.json(
        { error: "Failed to decrypt response" },
        { status: 400 }
      );
    }

    // Parse the JSON response
    const response = JSON.parse(new TextDecoder().decode(decryptedData));

    // Clean up - remove the used connection
    pendingConnections.delete(connectionId);

    if (response.public_key) {
      return NextResponse.json({
        success: true,
        walletAddress: response.public_key,
        session: response.session, // Phantom may return a session token
      });
    }

    return NextResponse.json(
      { error: "No public key in response" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Decrypt error:", error);
    return NextResponse.json(
      { error: "Decryption failed" },
      { status: 500 }
    );
  }
}
