import { createHmac } from "crypto"

// TOTP configuration
const TOTP_WINDOW = 1 // Allow 1 step before/after current time
const TOTP_STEP = 30 // 30 seconds per step
const TOTP_DIGITS = 6 // 6 digit codes

// Base32 decode function
function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  const value = 0

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i].toUpperCase()
    const index = alphabet.indexOf(char)
    if (index === -1) continue

    bits += index.toString(2).padStart(5, "0")
  }

  const bytes = []
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.substr(i, 8)
    if (byte.length === 8) {
      bytes.push(Number.parseInt(byte, 2))
    }
  }

  return Buffer.from(bytes)
}

// Generate HOTP value
function generateHOTP(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  counterBuffer.writeUInt32BE(counter & 0xffffffff, 4)

  const hmac = createHmac("sha1", key)
  hmac.update(counterBuffer)
  const digest = hmac.digest()

  const offset = digest[digest.length - 1] & 0xf
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  return (code % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, "0")
}

// Generate TOTP value
function generateTOTP(secret: string, timestamp?: number): string {
  const time = timestamp || Math.floor(Date.now() / 1000)
  const counter = Math.floor(time / TOTP_STEP)
  return generateHOTP(secret, counter)
}

// Verify TOTP code
export function verifyTOTP(token: string, secret: string, timestamp?: number): boolean {
  const time = timestamp || Math.floor(Date.now() / 1000)
  const counter = Math.floor(time / TOTP_STEP)

  // Check current time and window around it
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const testCounter = counter + i
    const expectedToken = generateHOTP(secret, testCounter)

    if (token === expectedToken) {
      return true
    }
  }

  return false
}

// Generate TOTP URI for QR code
export function generateTOTPUri(username: string, secret: string, issuer: string): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: TOTP_DIGITS.toString(),
    period: TOTP_STEP.toString(),
  })

  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?${params.toString()}`
}
