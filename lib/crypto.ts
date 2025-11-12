export interface QRPayload {
  sid: string
  nonce: string
  exp: number
  sig: string
}

/**
 * Generate a signed QR payload
 * @param sessionId - Unique session identifier
 * @param secret - HMAC secret (from env var)
 * @param expirySeconds - Token expiry in seconds (default: 10)
 */
export async function generateQRPayload(sessionId: string, secret: string, expirySeconds = 10): Promise<QRPayload> {
  // Use browser native crypto to generate random bytes
  const nonceBytes = new Uint8Array(8)
  globalThis.crypto.getRandomValues(nonceBytes)
  const nonce = Array.from(nonceBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  const exp = Math.floor(Date.now() / 1000) + expirySeconds

  // Create HMAC signature
  const message = `${sessionId}:${nonce}:${exp}`
  const encoder = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const signature = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(message))
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  return {
    sid: sessionId,
    nonce,
    exp,
    sig,
  }
}

/**
 * Verify a QR payload signature
 * @param payload - QR payload to verify
 * @param secret - HMAC secret (from env var)
 */
export async function verifyQRPayload(payload: QRPayload, secret: string): Promise<boolean> {
  // Check expiry first
  const now = Math.floor(Date.now() / 1000)
  if (now > payload.exp) {
    return false
  }

  // Verify signature
  const message = `${payload.sid}:${payload.nonce}:${payload.exp}`
  const encoder = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  )

  // Decode base64url signature
  const sig = payload.sig + "===".slice((payload.sig.length + 3) % 4)
  const sigBytes = new Uint8Array(
    atob(sig.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((c) => c.charCodeAt(0)),
  )

  return globalThis.crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(message))
}

/**
 * Generate a session ID with timestamp
 */
export function generateSessionId(): string {
  const date = new Date()
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const dateStr = `${year}${month}${day}${hours}${minutes}`

  const randBytes = new Uint8Array(3)
  globalThis.crypto.getRandomValues(randBytes)
  const rand = Array.from(randBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return `SESSION_${dateStr}_${rand}`
}
