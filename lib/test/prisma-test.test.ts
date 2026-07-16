import { describe, expect, it } from 'vitest'
import { TEST_EMAIL_DOMAIN, testEmail } from '@/lib/test/prisma-test'

describe('prisma-test helpers', () => {
  it('builds unique emails in the test domain', () => {
    const a = testEmail('user')
    const b = testEmail('user')
    expect(a).toContain(TEST_EMAIL_DOMAIN)
    expect(a).toMatch(/^user-\d+-\d+@test\.local$/)
    expect(a).not.toBe(b)
  })
})
