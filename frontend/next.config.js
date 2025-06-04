/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use static export but with proper configuration
  output: 'export',
  
  // Configure output directory explicitly
  distDir: '.next',
  
  // API routes won't work with static export, but we'll handle this client-side
  // by making direct calls to the backend
  
  // Configure images for static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
