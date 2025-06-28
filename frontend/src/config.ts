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
  const baseUrl = 'https://api-production-ef16.up.railway.app';
  // Remove leading slash from endpoint if present to prevent double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  // Combine base URL with endpoint
  const url = `${baseUrl}/${cleanEndpoint}`;
  console.log('Generated API URL:', url); // Debug log
  return url;
};

// Log the API URL in development for debugging
if (process.env.NODE_ENV !== 'production') {
  console.log('Using API Base URL:', config.apiBaseUrl);
}

export { getApiUrl };
export default config;
