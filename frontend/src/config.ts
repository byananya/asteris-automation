// API Configuration
export const config = {
  // Use environment variable or default to empty string for relative URLs
  // In development, this will use relative URLs to match the current domain
  // In production, it will use the production API URL if NEXT_PUBLIC_API_BASE_URL is not set
  apiBaseUrl: 
    process.env.NEXT_PUBLIC_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://api-production-ef16.up.railway.app' 
      : ''),
  
  // API endpoints
  apiEndpoints: {
    reconciliation: '/api/reconciliation',
    reconcile: '/api/reconcile',
  },
  
  // App info
  appName: 'Asteris Automation',
  version: '1.0.0',
};

// Helper function to get full API URL
const getApiUrl = (endpoint: string) => {
  // If apiBaseUrl is empty, it means we're using relative URLs
  if (!config.apiBaseUrl) return endpoint;
  // Otherwise, combine base URL with endpoint
  return `${config.apiBaseUrl}${endpoint}`;
};

// Log the API URL in development for debugging
if (process.env.NODE_ENV !== 'production') {
  console.log('Using API Base URL:', config.apiBaseUrl);
}

export { getApiUrl };
export default config;
