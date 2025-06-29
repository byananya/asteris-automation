// API Configuration
export const config = {
  // Use Railway/Netlify/Vercel env variable if set, otherwise fallback to production URL
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api-production-ef16.up.railway.app',

  // API endpoints (optional: can be removed if not used)
  apiEndpoints: {
    reconciliation: (process.env.NEXT_PUBLIC_API_URL || 'https://api-production-ef16.up.railway.app') + '/reconciliation',
    reconcile: (process.env.NEXT_PUBLIC_API_URL || 'https://api-production-ef16.up.railway.app') + '/reconcile',
  },

  // App info
  appName: 'Asteris Automation',
  version: '1.0.0',
};

// Helper function to get full API URL
function getApiUrl(endpoint: string) {
  const baseUrl = config.apiBaseUrl;
  // Remove leading slash from endpoint if present to prevent double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  // Combine base URL with endpoint
  const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${cleanEndpoint}`;
  console.log('Generated API URL:', url); // Debug log
  return url;
}

// Log the API URL and NODE_ENV in all environments for debugging
console.log('Using API Base URL (ALL ENVS):', config.apiBaseUrl, 'NODE_ENV:', process.env.NODE_ENV);

export { getApiUrl };
export default config;
