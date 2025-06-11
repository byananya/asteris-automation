/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export
  output: 'export',
  
  // Configure images for static export
  images: {
    unoptimized: true,
  },
  
  // Set the output directory to 'out' for static export
  distDir: 'out',
  
  // Disable React StrictMode for static export
  reactStrictMode: false,
  
  // Skip API routes during export (handled by generateStaticParams in App Router)
  skipTrailingSlashRedirect: true,
  
  // Only enable rewrites and redirects in development
  ...(process.env.NODE_ENV === 'development' && {
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          ],
        },
      ]
    },
  }),
};

module.exports = nextConfig;
