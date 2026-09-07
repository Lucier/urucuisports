import { createHash, randomBytes } from 'crypto'
import { db } from '@/database/client'
import { refreshTokens } from '@/database/schema'
import { and, eq, gt, isNull } from 'drizzle-orm'

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export const refreshTokenRepository = {
  async create(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex')
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

    await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt })
    return token
  },

  async findValid(token: string) {
    const tokenHash = hashToken(token)
    const [rt] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          gt(refreshTokens.expiresAt, new Date()),
          isNull(refreshTokens.revokedAt),
        ),
      )
    return rt ?? null
  },

  async revoke(token: string): Promise<void> {
    const tokenHash = hashToken(token)
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash))
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
  },
}
