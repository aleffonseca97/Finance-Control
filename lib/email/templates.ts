type EmailCopy = {
  brand: string
  welcome: {
    greeting: string
    greetingGeneric: string
    title: string
    body: string
    footer: string
  }
  passwordReset: {
    title: string
    body: string
    button: string
    copyLink: string
    ignore: string
  }
}

function shell(inner: string, lang: string, brand: string) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#0f172a;background:#f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;padding:28px 24px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
          <tr><td>${inner}</td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#64748b;">${brand}</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function welcomeEmailHtml(
  name: string | null,
  copy: EmailCopy['welcome'],
  options?: { locale?: string; brand?: string },
) {
  const locale = options?.locale ?? 'pt-BR'
  const brand = options?.brand ?? 'Logos Finance'
  const greeting = name ? copy.greeting : copy.greetingGeneric

  return shell(
    `
    <h1 style="margin:0 0 12px;font-size:22px;">${copy.title}</h1>
    <p style="margin:0 0 16px;">${greeting}!</p>
    <p style="margin:0 0 16px;">${copy.body}</p>
    <p style="margin:0;">${copy.footer}</p>
  `,
    locale,
    brand,
  )
}

export function passwordResetEmailHtml(
  resetUrl: string,
  copy: EmailCopy['passwordReset'],
  options?: { locale?: string; brand?: string },
) {
  const locale = options?.locale ?? 'pt-BR'
  const brand = options?.brand ?? 'Logos Finance'

  return shell(
    `
    <h1 style="margin:0 0 12px;font-size:22px;">${copy.title}</h1>
    <p style="margin:0 0 16px;">${copy.body}</p>
    <p style="margin:0 0 20px;">
      <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">${copy.button}</a>
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:#64748b;">${copy.copyLink}</p>
    <p style="margin:0;word-break:break-all;font-size:13px;color:#334155;">${resetUrl}</p>
    <p style="margin:20px 0 0;font-size:14px;color:#64748b;">${copy.ignore}</p>
  `,
    locale,
    brand,
  )
}
