/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output a standalone server for production
  output: 'standalone',
  
  // Disable React strict mode to prevent double rendering in development
  reactStrictMode: false,
  
  // Disable powered by header for security
  poweredByHeader: false,
  
  // Enable compression
  compress: true,
  
  // Configure base path if needed (e.g., when deploying to a subdirectory)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Configure asset prefix for CDN support
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_BASE_URL : '',
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
    unoptimized: true, // Required for static export
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },

  // Enable static HTML export
  trailingSlash: true,
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Add any custom webpack config here
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
};

// Only enable in production
if (process.env.NODE_ENV === 'production') {
  nextConfig.swcMinify = true;
  nextConfig.compress = true;
}

module.exports = nextConfig;
