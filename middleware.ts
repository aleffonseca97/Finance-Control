import { withAuth } from 'next-auth/middleware'
import type { NextMiddlewareWithAuth } from 'next-auth/middleware'
import type { JWT } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { IDLE_MAX_MS, SESSION_MAX_AGE_SEC } from './lib/session-ttl'

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
  if (!token) return NextResponse.next()

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) return NextResponse.next()

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

    const res = NextResponse.next()
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
    return NextResponse.next()
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
