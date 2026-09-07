import { describe, it, expect, beforeAll } from 'vitest'
import { signToken, verifyToken } from '@/lib/jwt'
import { UserRole } from '@/shared/types/auth'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-characters-long!!'
})

const payload = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  role: UserRole.USER,
}

describe('JWT', () => {
  it('assina e verifica um token válido', async () => {
    const token = await signToken(payload)
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const decoded = await verifyToken(token)
    expect(decoded.userId).toBe(payload.userId)
    expect(decoded.email).toBe(payload.email)
    expect(decoded.role).toBe(payload.role)
  })

  it('rejeita um token adulterado', async () => {
    const token = await signToken(payload)
    const tampered = token.slice(0, -5) + 'xxxxx'
    await expect(verifyToken(tampered)).rejects.toThrow()
  })

  it('rejeita um token com segredo diferente', async () => {
    const token = await signToken(payload)
    process.env.JWT_SECRET = 'completely-different-secret-also-long-enough!!'
    await expect(verifyToken(token)).rejects.toThrow()
    process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-characters-long!!'
  })

  it('lança erro se JWT_SECRET não estiver definido', async () => {
    const original = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    await expect(signToken(payload)).rejects.toThrow('JWT_SECRET')
    process.env.JWT_SECRET = original
  })
})
