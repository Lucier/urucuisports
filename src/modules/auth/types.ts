import type { UserRole } from '@/shared/types/auth'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string | UserRole
}

export type AuthResult = {
  token: string
  refreshToken: string
  user: AuthUser
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
