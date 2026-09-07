type RateLimitEntry = { count: number; resetAt: number }

const store = new Map<string, RateLimitEntry>()

// Cleanup entries older than 1 hour every 10 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of store.entries()) {
        if (now > entry.resetAt + 60_000) store.delete(key)
      }
    },
    10 * 60 * 1000,
  )
}

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 }
}
