import createIntlMiddleware from 'next-intl/middleware'
import type { JWT } from 'next-auth/jwt'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { routing } from '@/i18n/routing'
import { IDLE_MAX_MS, SESSION_MAX_AGE_SEC } from './lib/session-ttl'

const intlMiddleware = createIntlMiddleware(routing)
const localesPattern = routing.locales.join('|')

function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(new RegExp(`^/(${localesPattern})(/|$)`))
  return match?.[1] ?? routing.defaultLocale
}

function isDashboardPath(pathname: string): boolean {
  return new RegExp(`^/(${localesPattern})/dashboard`).test(pathname)
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

/** Refresh idle TTL on the existing intl response (do not replace it — that drops locale headers). */
async function applySessionRefresh(
  req: NextRequest,
  token: JWT,
  response: NextResponse,
): Promise<NextResponse> {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) return response

  const now = Date.now()
  const lastActivity =
    typeof token.lastActivity === 'number'
      ? token.lastActivity
      : typeof token.iat === 'number'
        ? token.iat * 1000
        : now

  if (now - lastActivity > IDLE_MAX_MS) {
    const locale = getLocaleFromPath(req.nextUrl.pathname)
    const url = new URL(`/${locale}/login`, req.url)
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

    response.cookies.set(sessionCookieName(), newJwt, {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SEC,
    })
  } catch {
    // Keep intl response even if session refresh fails
  }

  return response
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (isDashboardPath(pathname)) {
    const token = (await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    })) as JWT | null

    if (!token) {
      const locale = getLocaleFromPath(pathname)
      const url = new URL(`/${locale}/login`, req.url)
      url.searchParams.set(
        'callbackUrl',
        `${pathname}${req.nextUrl.search}`,
      )
      return NextResponse.redirect(url)
    }

    // Always run next-intl on dashboard routes. Skipping it made requestLocale
    // fall back to pt-BR, so /en/dashboard still rendered Portuguese copy.
    const intlResponse = intlMiddleware(req)
    return applySessionRefresh(req, token, intlResponse)
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: [
    '/',
    '/(pt-BR|en|it)/:path*',
    // Redireciona paths sem locale (ex.: /login do NextAuth) para /{locale}/...
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
