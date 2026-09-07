import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { UserRole } from '@/shared/types/auth'
import { AUTH_COOKIE } from '@/lib/auth'

const PUBLIC_API_ROUTES = ['/api/auth/login', '/api/auth/register', '/api/health']
const ADMIN_ROUTES = ['/api/admin', '/admin']
const PROTECTED_ROUTES = ['/api/auth/me', '/api/auth/logout']

function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (matchesRoutes(pathname, PUBLIC_API_ROUTES)) {
    return NextResponse.next()
  }

  const isProtected = matchesRoutes(pathname, PROTECTED_ROUTES)
  const isAdminRoute = matchesRoutes(pathname, ADMIN_ROUTES)

  if (!isProtected && !isAdminRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const user = await verifyToken(token)

    if (isAdminRoute && user.role !== UserRole.ADMIN) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId)
    requestHeaders.set('x-user-role', user.role)
    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))

    response.cookies.delete(AUTH_COOKIE)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
