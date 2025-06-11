/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  reactStrictMode: false,
  
  // Enable standalone output for production
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Development-only settings
  ...(process.env.NODE_ENV === 'development' && {
    // Development headers for CORS
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-stripe-key' },
          ],
        },
      ];
    },
  }),
};

module.exports = nextConfig;
