const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
