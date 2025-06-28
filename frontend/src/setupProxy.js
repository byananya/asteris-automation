const { createProxyMiddleware } = require('http-proxy-middleware');

// Only enable proxy in development
if (process.env.NODE_ENV === 'development') {
  module.exports = function(app) {
    const apiProxy = createProxyMiddleware({
      target: 'https://api-production-ef16.up.railway.app',
      changeOrigin: true,
      secure: true,
      pathRewrite: {
        '^/api': '/api',
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('x-forwarded-proto', 'https');
        console.log('Development: Proxying request to:', proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('Development proxy error:', err);
        res.status(500).json({ error: 'Development proxy error', details: err.message });
      },
      logLevel: 'debug',
    });

    app.use('/api', apiProxy);
    app.use('/reconcile', apiProxy);
  };
} else {
  module.exports = function() {
    console.log('Production: Proxy middleware is disabled. Using direct API calls.');
  };
}
