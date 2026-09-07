import { describe, it, expect, beforeEach, vi } from 'vitest'

// Isola o módulo para resetar o store entre testes
vi.mock('@/lib/rate-limit', async () => {
  const { rateLimit: original } = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit')
  return { rateLimit: original }
})

// Reseta o módulo antes de cada teste para limpar o store
beforeEach(() => {
  vi.resetModules()
})

describe('rateLimit', () => {
  it('permite requisições dentro do limite', async () => {
    const { rateLimit } = await import('@/lib/rate-limit')
    const result = rateLimit('test-ip', 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('bloqueia após atingir o limite', async () => {
    const { rateLimit } = await import('@/lib/rate-limit')
    const id = 'block-test-ip'
    for (let i = 0; i < 3; i++) rateLimit(id, 3, 60_000)
    const result = rateLimit(id, 3, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('reseta o contador após a janela expirar', async () => {
    vi.useFakeTimers()
    const { rateLimit } = await import('@/lib/rate-limit')
    const id = 'reset-test-ip'

    rateLimit(id, 1, 1000)
    expect(rateLimit(id, 1, 1000).allowed).toBe(false)

    vi.advanceTimersByTime(1001)
    expect(rateLimit(id, 1, 1000).allowed).toBe(true)
    vi.useRealTimers()
  })

  it('isola contadores por identificador', async () => {
    const { rateLimit } = await import('@/lib/rate-limit')
    for (let i = 0; i < 2; i++) rateLimit('ip-a', 2, 60_000)
    const result = rateLimit('ip-b', 2, 60_000)
    expect(result.allowed).toBe(true)
  })
})
