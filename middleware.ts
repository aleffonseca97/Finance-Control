import { withAuth } from 'next-auth/middleware'
import type { NextMiddlewareWithAuth } from 'next-auth/middleware'
import type { JWT } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { IDLE_MAX_MS, SESSION_MAX_AGE_SEC } from './lib/session-ttl'

/** Clone request headers and set pathname for Server Components (see Next.js middleware docs). */
function nextWithPathname(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

function secureCookie(): boolean {
  return (
    process.env.NEXTAUTH_URL?.startsWith('https://') ??
    (!!process.env.VERCEL && process.env.VERCEL_ENV === 'production')
  )
}

function sessionCookieName(): string {
  return secureCookie()
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'
}

const middleware: NextMiddlewareWithAuth = async (req) => {
  const token = req.nextauth.token as JWT | null
  if (!token) {
    return nextWithPathname(req)
  }

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) {
    return nextWithPathname(req)
  }

  const now = Date.now()
  const lastActivity =
    typeof token.lastActivity === 'number'
      ? token.lastActivity
      : typeof token.iat === 'number'
        ? token.iat * 1000
        : now

  if (now - lastActivity > IDLE_MAX_MS) {
    const url = new URL('/login', req.url)
    url.searchParams.set(
      'callbackUrl',
      `${req.nextUrl.pathname}${req.nextUrl.search}`,
    )
    const res = NextResponse.redirect(url)
    const name = sessionCookieName()
    res.cookies.set(name, '', { path: '/', maxAge: 0 })
    if (name.startsWith('__Secure')) {
      res.cookies.set('next-auth.session-token', '', { path: '/', maxAge: 0 })
    } else {
      res.cookies.set('__Secure-next-auth.session-token', '', {
        path: '/',
        maxAge: 0,
      })
    }
    return res
  }

  try {
    const { exp: _e, iat: _i, jti: _j, nbf: _n, ...payload } = token
    const newJwt = await encode({
      secret,
      token: {
        ...payload,
        lastActivity: now,
      },
      maxAge: SESSION_MAX_AGE_SEC,
    })

    const res = nextWithPathname(req)
    const secure = secureCookie()
    res.cookies.set(sessionCookieName(), newJwt, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SEC,
    })
    return res
  } catch {
    return nextWithPathname(req)
  }
}

export default withAuth(middleware, {
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: ['/dashboard/:path*'],
}
