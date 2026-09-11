import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSql = vi.hoisted(() => vi.fn())
vi.mock('@/database/client', () => ({ client: mockSql, db: {} }))

import { rateLimit } from '@/lib/rate-limit'

function makeRow(count: number, resetAtMs: number) {
  return [{ count, reset_at: new Date(resetAtMs) }]
}

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('permite requisições dentro do limite', async () => {
    mockSql.mockResolvedValue(makeRow(1, Date.now() + 60_000))
    const result = await rateLimit('test-ip', 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('bloqueia após atingir o limite', async () => {
    mockSql.mockResolvedValue(makeRow(4, Date.now() + 60_000))
    const result = await rateLimit('block-test-ip', 3, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('permite a última requisição no limite exato', async () => {
    mockSql.mockResolvedValue(makeRow(3, Date.now() + 60_000))
    const result = await rateLimit('edge-ip', 3, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('isola contadores por identificador', async () => {
    mockSql.mockResolvedValue(makeRow(1, Date.now() + 60_000))
    const result = await rateLimit('ip-b', 2, 60_000)
    expect(result.allowed).toBe(true)
    expect(mockSql).toHaveBeenCalledTimes(1)
  })
})
