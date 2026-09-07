import { hash, compare } from 'bcryptjs'
import { usersRepository } from '@/modules/users/repository'
import { signToken } from '@/lib/jwt'
import { UserRole } from '@/shared/types/auth'
import { AuthError, type AuthResult } from './types'
import { refreshTokenRepository } from './refresh-token.repository'
import type { LoginInput, RegisterInput } from './schemas'

const BCRYPT_ROUNDS = 10

export const authService = {
  async login(data: LoginInput): Promise<AuthResult> {
    const user = await usersRepository.findByEmail(data.email)

    // Mensagem genérica para não revelar se o e-mail existe
    if (!user) {
      throw new AuthError('E-mail ou senha inválidos.', 401)
    }

    const passwordMatch = await compare(data.password, user.password)
    if (!passwordMatch) {
      throw new AuthError('E-mail ou senha inválidos.', 401)
    }

    const [token, refreshToken] = await Promise.all([
      signToken({ userId: user.id, email: user.email, role: user.role as UserRole }),
      refreshTokenRepository.create(user.id),
    ])

    return {
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  },

  async register(data: RegisterInput): Promise<AuthResult> {
    const existing = await usersRepository.findByEmail(data.email)
    if (existing) {
      throw new AuthError('E-mail já cadastrado.', 409)
    }

    const hashedPassword = await hash(data.password, BCRYPT_ROUNDS)

    const user = await usersRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    })

    const [token, refreshToken] = await Promise.all([
      signToken({ userId: user.id, email: user.email, role: user.role as UserRole }),
      refreshTokenRepository.create(user.id),
    ])

    return {
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  },

  async hashPassword(password: string): Promise<string> {
    return hash(password, BCRYPT_ROUNDS)
  },

  async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed)
  },
}
