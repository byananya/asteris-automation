/** @type {import('next').NextConfig} */
const nextConfig = {
  // For local development, proxy API requests to the backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/api/:path*', // Proxy to your backend
      },
    ];
  },
  
  // Configure images for static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
