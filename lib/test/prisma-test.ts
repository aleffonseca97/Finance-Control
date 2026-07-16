/**
 * Helpers for Prisma-backed integration tests.
 *
 * Setup:
 * 1. Copy `.env.test.example` → `.env.test` and set DATABASE_URL to a dedicated DB.
 * 2. Run: `npx dotenv -e .env.test -- prisma migrate deploy`
 * 3. In Vitest (or scripts), load `.env.test` before importing `@/lib/db`.
 *
 * Example (future integration test):
 *   process.env.DATABASE_URL = process.env.DATABASE_URL // from .env.test
 *   const { prisma } = await import('@/lib/db')
 *   await prisma.user.deleteMany({ where: { email: { endsWith: '@test.local' } } })
 */

export const TEST_EMAIL_DOMAIN = '@test.local'

let emailSeq = 0

export function testEmail(prefix: string) {
  emailSeq += 1
  return `${prefix}-${Date.now()}-${emailSeq}${TEST_EMAIL_DOMAIN}`
}
