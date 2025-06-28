const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const apiProxy = createProxyMiddleware({
    target: 'https://api-production-ef16.up.railway.app',
    changeOrigin: true,
    secure: true,
    pathRewrite: {
      '^/api': '/api', // Keep the /api prefix
    },
    onProxyReq: (proxyReq) => {
      // Add any required headers here
      proxyReq.setHeader('x-forwarded-proto', 'https');
      console.log('Proxying request to:', proxyReq.path);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
    logLevel: 'debug',
  });

  // Apply the proxy to all /api routes
  app.use('/api', apiProxy);
  
  // Also proxy specific endpoints without the /api prefix if needed
  app.use('/reconcile', apiProxy);
};
