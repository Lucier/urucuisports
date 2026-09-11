import { client } from '@/database/client'

export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const rows = await client`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${identifier}, 1, NOW() + (${windowMs} * interval '1 millisecond'))
    ON CONFLICT (key) DO UPDATE
    SET
      count = CASE
        WHEN rate_limits.reset_at < NOW() THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at < NOW() THEN NOW() + (${windowMs} * interval '1 millisecond')
        ELSE rate_limits.reset_at
      END
    RETURNING count, reset_at
  `

  const { count, reset_at } = rows[0] as { count: number; reset_at: Date }
  const resetAtMs = new Date(reset_at).getTime()

  if (count > limit) {
    return { allowed: false, remaining: 0, retryAfterMs: resetAtMs - Date.now() }
  }

  return { allowed: true, remaining: limit - count, retryAfterMs: 0 }
}
