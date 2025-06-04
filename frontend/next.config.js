/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to enable API routes
  // output: 'export',
  
  // Enable rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL || 'http://localhost:3011/api/:path*',
      },
    ];
  },
  
  // Configure images
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
