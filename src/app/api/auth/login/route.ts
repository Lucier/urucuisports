import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/modules/auth/service'
import { loginSchema } from '@/modules/auth/schemas'
import { AuthError } from '@/modules/auth/types'
import {
  ACCESS_TOKEN_LIFETIME_S,
  AUTH_COOKIE,
  COOKIE_OPTIONS,
  EXPIRY_COOKIE,
  EXPIRY_COOKIE_OPTIONS,
  REFRESH_COOKIE,
  REFRESH_COOKIE_OPTIONS,
} from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { checkBodySize } from '@/lib/request'

// 5 tentativas por IP a cada 15 minutos
const LIMIT = 5
const WINDOW_MS = 15 * 60 * 1000

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const sizeError = checkBodySize(request)
  if (sizeError) return sizeError

  const { allowed, remaining, retryAfterMs } = rateLimit(`login:${ip}`, LIMIT, WINDOW_MS)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const { token, refreshToken, user } = await authService.login(parsed.data)
    const response = NextResponse.json({ user }, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
    response.cookies.set(AUTH_COOKIE, token, COOKIE_OPTIONS)
    response.cookies.set(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS)
    response.cookies.set(
      EXPIRY_COOKIE,
      String(Math.floor(Date.now() / 1000) + ACCESS_TOKEN_LIFETIME_S),
      EXPIRY_COOKIE_OPTIONS,
    )
    return response
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[login] Unexpected error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
