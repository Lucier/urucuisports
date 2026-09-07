import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '@/modules/auth/schemas'

describe('loginSchema', () => {
  it('aceita credenciais válidas', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'anypass' })
    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '123' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha vazia', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'Senha@123',
  }

  it('aceita dados válidos', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita senha sem maiúscula', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'senha@123' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha sem minúscula', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'SENHA@123' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha sem número', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Senha@abc' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha sem caractere especial', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Senha1234' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Ab@1' })
    expect(result.success).toBe(false)
  })

  it('rejeita nome muito curto', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'A' })
    expect(result.success).toBe(false)
  })
})
