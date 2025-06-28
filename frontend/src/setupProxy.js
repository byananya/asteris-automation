const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://api-production-ef16.up.railway.app',
      changeOrigin: true,
      secure: true, 
      pathRewrite: {
        '^/api': '', 
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('x-forwarded-proto', 'https');
      },
    })
  );
};
