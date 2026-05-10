import { APP_NAME } from '@/lib/version'
import { getOptionalAppBaseUrl } from './app-url'

const BRAND = '#4f46e5'
const BRAND_DARK = '#312e81'
const TEXT = '#0f172a'
const MUTED = '#64748b'
const BORDER = '#e2e8f0'
const SURFACE = '#f8fafc'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function shell(inner: string, preheader: string) {
  const safePre = escapeHtml(preheader)
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>${APP_NAME}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.55;color:${TEXT};background:${SURFACE};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;width:0;height:0;">${safePre}&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.06);border:1px solid ${BORDER};">
          <tr>
            <td style="padding:0 28px;background:linear-gradient(135deg,${BRAND_DARK} 0%,${BRAND} 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:22px 0 20px;">
                    <p style="margin:0;font-size:17px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">${APP_NAME}</p>
                    <p style="margin:6px 0 0;font-size:13px;font-weight:500;color:rgba(255,255,255,.88);">Finanças pessoais com clareza</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 32px;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;border-top:1px solid ${BORDER};">
              <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:${MUTED};text-align:center;">
                © ${year} ${APP_NAME}. Este e-mail foi enviado automaticamente; respostas podem não ser lidas.<br />
                <span style="color:${MUTED};">Planeje, acompanhe e evolua com seus números em um só lugar.</span>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:11px;color:#94a3b8;">Se este e-mail parecer suspeito, não clique em links e acesse o ${APP_NAME} apenas pelo site ou app que você costuma usar.</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string) {
  const safeHref = escapeHtml(href)
  const safeLabel = escapeHtml(label)
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
    <tr>
      <td style="border-radius:10px;background:${BRAND};">
        <a href="${safeHref}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${safeLabel}</a>
      </td>
    </tr>
  </table>`
}

export function welcomeEmailHtml(name: string | null) {
  const greeting = name ? `Olá, ${escapeHtml(name)}` : 'Olá'
  const base = getOptionalAppBaseUrl()
  const dashboardUrl = base ? `${base}/dashboard` : null
  const preheader = 'Sua conta está pronta. Organize receitas, despesas e metas em um só painel.'

  const ctaBlock = dashboardUrl
    ? `${ctaButton(dashboardUrl, 'Abrir meu painel')}
    <p style="margin:12px 0 0;font-size:13px;color:${MUTED};">Ou acesse diretamente: <a href="${escapeHtml(dashboardUrl)}" style="color:${BRAND};text-decoration:underline;">${escapeHtml(dashboardUrl)}</a></p>`
    : `<p style="margin:0 0 8px;font-size:14px;color:${MUTED};">Faça login no ${APP_NAME} pelo endereço que você costuma usar para acessar o aplicativo.</p>`

  const inner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND};">Conta criada</p>
    <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;letter-spacing:-0.02em;line-height:1.25;color:${TEXT};">Bem-vindo ao ${APP_NAME}</h1>
    <p style="margin:0 0 18px;font-size:16px;color:${TEXT};">${greeting} — é um prazer ter você com a gente.</p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;">Sua conta foi criada com sucesso. A partir de agora você pode centralizar o que entra, o que sai e o que importa para o seu futuro financeiro.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${TEXT};">Por aqui você pode:</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;">• Registrar receitas e despesas com categorias que fazem sentido para você</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;">• Acompanhar saldos e hábitos ao longo do tempo, sem planilhas soltas</p>
          <p style="margin:0;font-size:14px;color:#334155;">• Manter tudo organizado em um painel pensado para o dia a dia</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:${TEXT};">Próximo passo</p>
    ${ctaBlock}
    <p style="margin:28px 0 0;font-size:14px;color:${MUTED};">Dúvidas sobre o uso do ${APP_NAME}? Use a ajuda ou as configurações dentro do aplicativo.</p>
  `

  return shell(inner, preheader)
}

export function passwordResetEmailHtml(resetUrl: string) {
  const safeUrl = escapeHtml(resetUrl)
  const preheader = 'Use o link seguro abaixo para criar uma nova senha. Ele expira em uma hora.'

  const inner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND};">Segurança da conta</p>
    <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;letter-spacing:-0.02em;line-height:1.25;color:${TEXT};">Redefinição de senha</h1>
    <p style="margin:0 0 18px;font-size:16px;color:${TEXT};">Recebemos uma solicitação para alterar a senha da sua conta no <strong>${APP_NAME}</strong>.</p>
    <p style="margin:0 0 22px;font-size:15px;color:#334155;">Se você fez este pedido, clique no botão abaixo. O link é pessoal, de uso único e <strong>expira em 1 hora</strong> por motivos de segurança.</p>
    ${ctaButton(resetUrl, 'Criar nova senha')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;background:#fffbeb;border-radius:10px;border:1px solid #fde68a;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:#92400e;"><strong>Não solicitou esta alteração?</strong> Ignore este e-mail com tranquilidade — sua senha atual permanece válida e nenhuma mudança será feita.</p>
        </td>
      </tr>
    </table>
    <p style="margin:22px 0 8px;font-size:13px;color:${MUTED};">Se o botão não responder, copie o endereço abaixo e cole na barra do navegador:</p>
    <p style="margin:0;padding:12px 14px;background:${SURFACE};border-radius:8px;border:1px solid ${BORDER};word-break:break-all;font-size:12px;line-height:1.45;color:#475569;font-family:ui-monospace,Consolas,monospace;">${safeUrl}</p>
    <p style="margin:22px 0 0;font-size:13px;color:${MUTED};">Por segurança, nunca compartilhe este link. O ${APP_NAME} nunca pedirá sua senha por e-mail ou mensagem.</p>
  `

  return shell(inner, preheader)
}
