import { NextRequest, NextResponse } from 'next/server'

const ADMIN_USER_ID = '#3795@lgvns'

interface TokenPayload {
  id: number
  username: string
  role: string
  user_id: string
  exp?: number
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded as TokenPayload
  } catch {
    return null
  }
}

function isExpired(payload: TokenPayload): boolean {
  if (!payload.exp) return true
  return Date.now() >= payload.exp * 1000
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith('/admin')
  const isDashboardRoute = pathname.startsWith('/dashboard')

  // Public routes — always allow (no token required)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register') ||
    pathname.startsWith('/api/auth/me') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/books') ||
    pathname.startsWith('/api/categories') ||
    pathname.startsWith('/api/dashboard') ||
    pathname.startsWith('/api/notifications') ||
    pathname.startsWith('/api/hidden') ||
    pathname === '/' ||
    pathname === '/books' ||
    pathname.startsWith('/books/') ||
    pathname === '/search' ||
    pathname === '/faq' ||
    pathname.startsWith('/uploads/')
  ) {
    return NextResponse.next()
  }

  // All other API routes — let the route handler decide auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protected routes below this point require a valid token

  // Allow non-admin, non-dashboard pages through (they're public)
  if (!isAdminRoute && !isDashboardRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const payload = decodeToken(token)
  if (!payload || isExpired(payload)) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes require admin role
  if (isAdminRoute && payload.role !== 'admin') {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
