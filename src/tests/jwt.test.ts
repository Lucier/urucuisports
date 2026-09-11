import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { signToken, verifyToken } from '@/lib/jwt'
import { UserRole } from '@/shared/types/auth'

const SECRET_A = 'secret-a-must-be-at-least-32-characters-long!!'
const SECRET_B = 'secret-b-must-be-at-least-32-characters-long!!'
const SECRET_C = 'secret-c-completely-unknown-must-be-32-chars!!'

beforeAll(() => {
  process.env.JWT_SECRET = SECRET_A
})

afterEach(() => {
  process.env.JWT_SECRET = SECRET_A
  delete process.env.JWT_SECRET_PREVIOUS
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

  it('rejeita um token assinado com segredo desconhecido', async () => {
    process.env.JWT_SECRET = SECRET_C
    const token = await signToken(payload)
    process.env.JWT_SECRET = SECRET_A
    await expect(verifyToken(token)).rejects.toThrow()
  })

  it('lança erro se JWT_SECRET não estiver definido', async () => {
    const original = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    await expect(signToken(payload)).rejects.toThrow('JWT_SECRET')
    process.env.JWT_SECRET = original
  })

  describe('rotação de segredo', () => {
    it('valida token antigo quando JWT_SECRET_PREVIOUS está definido', async () => {
      // Assinar com segredo antigo (SECRET_A)
      const oldToken = await signToken(payload)

      // Rotacionar: novo segredo entra, antigo vai para PREVIOUS
      process.env.JWT_SECRET = SECRET_B
      process.env.JWT_SECRET_PREVIOUS = SECRET_A

      const decoded = await verifyToken(oldToken)
      expect(decoded.userId).toBe(payload.userId)
    })

    it('valida token novo com novo segredo durante rotação', async () => {
      process.env.JWT_SECRET = SECRET_B
      process.env.JWT_SECRET_PREVIOUS = SECRET_A

      const newToken = await signToken(payload)
      const decoded = await verifyToken(newToken)
      expect(decoded.userId).toBe(payload.userId)
    })

    it('rejeita token de segredo desconhecido mesmo com PREVIOUS definido', async () => {
      process.env.JWT_SECRET = SECRET_B
      process.env.JWT_SECRET_PREVIOUS = SECRET_A

      process.env.JWT_SECRET = SECRET_C
      const unknownToken = await signToken(payload)
      process.env.JWT_SECRET = SECRET_B

      await expect(verifyToken(unknownToken)).rejects.toThrow()
    })
  })
})
