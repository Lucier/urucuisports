import { SignJWT, jwtVerify, type JWTPayload as JosePayload } from 'jose'
import type { JWTPayload } from '@/shared/types/auth'

const TOKEN_EXPIRY = '1h'

function encodeSecret(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function getSecrets(): { current: Uint8Array; previous: Uint8Array | null } {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  const prev = process.env.JWT_SECRET_PREVIOUS
  return {
    current: encodeSecret(secret),
    previous: prev ? encodeSecret(prev) : null,
  }
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const { current } = getSecrets()
  return new SignJWT(payload as unknown as JosePayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(current)
}

// Tries current secret first; on failure falls back to JWT_SECRET_PREVIOUS.
// This allows zero-downtime rotation: set JWT_SECRET_PREVIOUS to the old value,
// update JWT_SECRET to the new value, deploy, then remove JWT_SECRET_PREVIOUS
// after all existing tokens have expired (1h).
export async function verifyToken(token: string): Promise<JWTPayload> {
  const { current, previous } = getSecrets()
  try {
    const { payload } = await jwtVerify(token, current)
    return payload as unknown as JWTPayload
  } catch (err) {
    if (previous) {
      const { payload } = await jwtVerify(token, previous)
      return payload as unknown as JWTPayload
    }
    throw err
  }
}
