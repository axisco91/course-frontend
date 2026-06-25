/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  trailingSlash: true,

  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }

    return config
  },

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // ❌ Sin CDN: sirve assets desde el MISMO host
  assetPrefix: undefined,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'academypro.app' },
      { protocol: 'https', hostname: '*.academypro.app' } // un * es suficiente
    ]
  },

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      },
      {
        source: '/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }]
      }
    ]
  }

  // ❌ Elimínalo: rompe la coherencia HTML↔assets entre hosts
  // generateBuildId: async () => `build-${Date.now()}`
}
