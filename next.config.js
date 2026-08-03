/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/echevin',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
