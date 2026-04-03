import { getServerSession, NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './db'
import { IDLE_MAX_MS, SESSION_MAX_AGE_SEC } from './session-ttl'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: credentials.email.trim(),
              mode: 'insensitive',
            },
          },
        })

        if (!user) return null

        const isValid = await compare(credentials.password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  jwt: {
    maxAge: SESSION_MAX_AGE_SEC,
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SEC,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      const now = Date.now()
      if (user) {
        token.id = user.id
        token.lastActivity = now
        return token
      }

      const lastActivity =
        typeof token.lastActivity === 'number'
          ? token.lastActivity
          : typeof token.iat === 'number'
            ? token.iat * 1000
            : now

      if (now - lastActivity > IDLE_MAX_MS) {
        return { ...token, exp: Math.floor(now / 1000) - 60 }
      }

      // lastActivity no cookie é atualizado no middleware (getServerSession em RSC não grava cookie).
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

export async function auth() {
  return getServerSession(authOptions)
}
