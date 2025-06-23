// API Configuration
export const config = {
  // Use relative URL in production, or localhost in development
  apiBaseUrl: 
    process.env.NEXT_PUBLIC_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000'),
  
  // API endpoints
  apiEndpoints: {
    reconciliation: '/api/reconciliation',
    // Add other API endpoints here
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
