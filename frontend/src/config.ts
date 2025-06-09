// API Configuration
export const config = {
  // Use environment variable if set, otherwise use relative path for production
  // or localhost for development
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' ? '' : 'http://localhost:4000'),
  
  // Add other configuration options here
  appName: 'Asteris Automation',
  version: '1.0.0',
};

export default config;
