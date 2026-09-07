import { SignJWT, jwtVerify, type JWTPayload as JosePayload } from 'jose'
import type { JWTPayload } from '@/shared/types/auth'

const TOKEN_EXPIRY = '1h'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as JosePayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as unknown as JWTPayload
}
