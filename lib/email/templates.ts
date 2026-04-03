function shell(inner: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
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
        <p style="margin:16px 0 0;font-size:12px;color:#64748b;">Logos Finance</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function welcomeEmailHtml(name: string | null) {
  const greeting = name ? `Olá, ${name}` : 'Olá'
  return shell(`
    <h1 style="margin:0 0 12px;font-size:22px;">Bem-vindo ao Logos Finance</h1>
    <p style="margin:0 0 16px;">${greeting}!</p>
    <p style="margin:0 0 16px;">Sua conta foi criada com sucesso. Você já pode organizar receitas, despesas e investimentos em um só lugar.</p>
    <p style="margin:0;">Qualquer dúvida, estamos à disposição.</p>
  `)
}

export function passwordResetEmailHtml(resetUrl: string) {
  return shell(`
    <h1 style="margin:0 0 12px;font-size:22px;">Redefinir senha</h1>
    <p style="margin:0 0 16px;">Recebemos um pedido para redefinir a senha da sua conta. Se foi você, clique no botão abaixo. O link expira em breve.</p>
    <p style="margin:0 0 20px;">
      <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Redefinir senha</a>
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:#64748b;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
    <p style="margin:0;word-break:break-all;font-size:13px;color:#334155;">${resetUrl}</p>
    <p style="margin:20px 0 0;font-size:14px;color:#64748b;">Se você não pediu isso, ignore este e-mail.</p>
  `)
}
