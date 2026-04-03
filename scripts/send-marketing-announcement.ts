/**
 * Envia e-mail de anúncio para usuários com marketingOptIn = true.
 *
 * Uso (na raiz do projeto):
 *   npx tsx scripts/send-marketing-announcement.ts "Assunto do e-mail" ./caminho/para/conteudo.html
 *
 * Requer .env com DATABASE_URL, RESEND_API_KEY e EMAIL_FROM (como no app).
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { loadEnvConfig } from '@next/env'
import { prisma } from '../lib/db'
import { sendProductUpdateEmail } from '../lib/email/send'

loadEnvConfig(process.cwd())

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const subject = process.argv[2]
  const htmlPath = process.argv[3]
  if (!subject || !htmlPath) {
    console.error(
      'Uso: npx tsx scripts/send-marketing-announcement.ts "<assunto>" <arquivo.html>'
    )
    process.exit(1)
  }

  const html = readFileSync(resolve(process.cwd(), htmlPath), 'utf-8')
  const users = await prisma.user.findMany({
    where: { marketingOptIn: true },
    select: { email: true },
  })

  console.log(`Encontrados ${users.length} usuários com opt-in de comunicações.`)

  for (const u of users) {
    const result = await sendProductUpdateEmail({
      to: u.email,
      subject,
      html,
    })
    if (result.ok === false) {
      const reason = result.skipped
        ? 'RESEND/EMAIL_FROM não configurados'
        : result.error
      console.error(`  [erro] ${u.email}: ${reason}`)
    } else {
      console.log(`  [ok] ${u.email}`)
    }
    await sleep(600)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
