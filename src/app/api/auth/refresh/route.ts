import { NextRequest, NextResponse } from 'next/server'
import { signToken } from '@/lib/jwt'
import { AUTH_COOKIE, COOKIE_OPTIONS, REFRESH_COOKIE, REFRESH_COOKIE_OPTIONS } from '@/lib/auth'
import { refreshTokenRepository } from '@/modules/auth/refresh-token.repository'
import { usersRepository } from '@/modules/users/repository'
import { UserRole } from '@/shared/types/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(REFRESH_COOKIE)?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rt = await refreshTokenRepository.findValid(token)
  if (!rt) {
    const res = NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
    res.cookies.set(REFRESH_COOKIE, '', { maxAge: 0, path: '/api/auth' })
    return res
  }

  const user = await usersRepository.findById(rt.userId)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const newToken = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
  })

  // Rotaciona o refresh token: revoga o atual, emite um novo
  const [, newRefreshToken] = await Promise.all([
    refreshTokenRepository.revoke(token),
    refreshTokenRepository.create(user.id),
  ])

  const response = NextResponse.json({ success: true })
  response.cookies.set(AUTH_COOKIE, newToken, COOKIE_OPTIONS)
  response.cookies.set(REFRESH_COOKIE, newRefreshToken, REFRESH_COOKIE_OPTIONS)
  return response
}
