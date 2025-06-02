/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Disable rewrites when using static export
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://localhost:3010/api/:path*',
  //     },
  //   ];
  // },
  // Configure images for static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
