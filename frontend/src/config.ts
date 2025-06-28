// API Configuration
export const config = {
  // Use environment variable or default to production URL
  // This ensures we always use the production API in all environments
  apiBaseUrl: 'https://api-production-ef16.up.railway.app',
  
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
