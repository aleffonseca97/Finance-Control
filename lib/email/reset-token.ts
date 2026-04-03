import { createHash, randomBytes } from 'crypto'

const TOKEN_BYTES = 32

/** Token em texto claro (vai no link); guarde apenas o hash no banco. */
export function createPasswordResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  const tokenHash = hashResetToken(token)
  return { token, tokenHash }
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}
