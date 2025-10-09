/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'cdn.shopify.com', 'printful-upload.s3-accelerate.amazonaws.com'],
  },
  // Disable output file tracing to prevent micromatch stack overflow
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  // Exclude mobile app and supabase functions from Next.js build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'expo-router': 'commonjs expo-router',
        'expo-status-bar': 'commonjs expo-status-bar',
      })
    }
    return config
  },
  // Exclude specific directories from being processed
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map(ext => `page.${ext}`).concat(['tsx', 'ts', 'jsx', 'js']),
  transpilePackages: [],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
    PRINTFUL_API_KEY: process.env.PRINTFUL_API_KEY,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    QR_DOMAIN: process.env.QR_DOMAIN || 'lql.to',
  },
}

module.exports = nextConfig
