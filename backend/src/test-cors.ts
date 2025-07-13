import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Configure CORS - Simplified configuration to fix preflight issues
const allowedOrigins = [
  'http://localhost:3000',
  'https://app.asterisai.org',
  'https://asteris-ai.vercel.app',
  'https://asteris-automation.vercel.app',
  'https://asteris-frontend-production.up.railway.app'
];

// Add any additional origins from environment variables
if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  envOrigins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

// Log all allowed origins for debugging
console.log('CORS Allowed Origins:', allowedOrigins);

const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      console.log(`CORS: Allowing request from origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS: Blocking request from non-allowed origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-stripe-key', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Apply CORS with the configured options
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly
app.options('*', (req, res) => {
  console.log('Handling OPTIONS preflight request for path:', req.path);
  // Set CORS headers manually for preflight
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-stripe-key, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Respond with 204 No Content
  res.status(204).end();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS test successful!' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CORS test server running on port ${PORT}`);
});
