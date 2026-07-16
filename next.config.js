const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Allow Playwright (and local tools) hitting 127.0.0.1 during `next dev`
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async redirects() {
    return [
      {
        source: '/dashboard/tabela-anual',
        destination: '/dashboard/parcelamentos',
        permanent: true,
      },
      {
        source: '/dashboard/tabela',
        destination: '/dashboard/parcelamentos',
        permanent: true,
      },
    ]
  },
}

module.exports = withNextIntl(nextConfig)
