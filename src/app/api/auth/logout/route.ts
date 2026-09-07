import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, REFRESH_COOKIE } from '@/lib/auth'
import { refreshTokenRepository } from '@/modules/auth/refresh-token.repository'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  if (refreshToken) {
    await refreshTokenRepository.revoke(refreshToken).catch(() => {})
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(AUTH_COOKIE, '', { maxAge: 0, path: '/' })
  response.cookies.set(REFRESH_COOKIE, '', { maxAge: 0, path: '/api/auth' })
  return response
}
