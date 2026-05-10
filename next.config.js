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

module.exports = nextConfig
