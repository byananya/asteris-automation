/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for standalone deployment
  output: 'export',
  
  // Disable React strict mode to prevent double rendering in development
  reactStrictMode: false,
  
  // Disable powered by header for security
  poweredByHeader: false,
  
  // Enable compression
  compress: true,
  
  // Image optimization
  images: {
    domains: ['api-production-ef16.up.railway.app'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
    unoptimized: true, // Required for static export
  },
  
  // Configure base path if needed (e.g., when deploying to a subdirectory)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Configure asset prefix for CDN support
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_BASE_URL : '',
  
  // Add trailing slash for static export
  trailingSlash: true,

  // Environment variables are inlined at build time
  publicRuntimeConfig: {
    // Will be available on both server and client
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://api-production-ef16.up.railway.app' 
      : 'https://api-production-ef16.up.railway.app',
  },
  
  // API route rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api-production-ef16.up.railway.app/api/:path*',
      },
    ];
  },
  // Disable server-side rendering for static export
  trailingSlash: true,


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
  // Enable SWC minification for smaller builds
  nextConfig.swcMinify = true;
  
  // Disable TypeScript checking during build for faster builds
  nextConfig.typescript = {
    ignoreBuildErrors: true,
  };
  
  // Disable ESLint during build
  nextConfig.eslint = {
    ignoreDuringBuilds: true,
  };
  nextConfig.compress = true;
}

module.exports = nextConfig;
