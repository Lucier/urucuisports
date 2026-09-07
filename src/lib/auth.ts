import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'
import { UserRole, type JWTPayload } from '@/shared/types/auth'

export const AUTH_COOKIE = 'auth-token'
export const REFRESH_COOKIE = 'refresh-token'
export const EXPIRY_COOKIE = 'token-expiry' // readable by JS to schedule proactive refresh

const IS_PROD = process.env.NODE_ENV === 'production'

export const ACCESS_TOKEN_LIFETIME_S = 60 * 60 // 1h — must match TOKEN_EXPIRY in jwt.ts

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  maxAge: ACCESS_TOKEN_LIFETIME_S,
  path: '/',
}

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 dias
  path: '/api/auth', // limita o envio do cookie apenas às rotas de auth
}

// Not httpOnly: JS needs to read expiry to schedule proactive token refresh
export const EXPIRY_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  maxAge: ACCESS_TOKEN_LIFETIME_S,
  path: '/',
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireRole(role: UserRole): Promise<JWTPayload> {
  const user = await requireAuth()
  if (user.role !== UserRole.ADMIN && user.role !== role) {
    throw new Error('Forbidden')
  }
  return user
}

type RouteHandler = (req: NextRequest, user: JWTPayload) => Promise<NextResponse>

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const token = req.cookies.get(AUTH_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
      const user = await verifyToken(token)
      return handler(req, user)
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}

export function withRole(role: UserRole, handler: RouteHandler) {
  return withAuth(async (req, user) => {
    if (user.role !== UserRole.ADMIN && user.role !== role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(req, user)
  })
}
