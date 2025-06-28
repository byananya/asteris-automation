import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';

const app = express();
const port = 3002;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://asteris-ai.vercel.app', // Add your production frontend URL here
  'https://asteris-automation.vercel.app' // Add any other allowed domains
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.warn(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-stripe-key', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle preflight requests
app.options('*', cors());

// Minimal Stripe reconciliation endpoint
app.get('/api/reconcile/invoices', async (req: Request, res: Response) => {
  try {
    // Return sample data for GET requests
    return res.json({
      success: true,
      message: 'GET endpoint for invoice reconciliation is working',
      summary: {
        totalInvoices: 0,
        matchedInvoices: 0,
        unmatchedInvoices: 0,
        totalAmount: 0,
        matchedAmount: 0,
        unmatchedAmount: 0,
        processingTime: '0ms',
        matchRate: 0
      },
      matches: [],
      issues: []
    });
  } catch (error: unknown) {
    console.error('Error in GET /api/reconcile/invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ 
      error: 'An error occurred',
      details: errorMessage 
    });
  }
});

// POST endpoint for invoice reconciliation
app.post('/api/reconcile/invoices', async (req: Request, res: Response) => {
  try {
    const stripeApiKey = req.headers['x-stripe-key'];
    
    if (!stripeApiKey) {
      return res.status(400).json({ 
        error: 'Missing Stripe API key in x-stripe-key header' 
      });
    }

    // For now, just return a success message
    return res.json({
      success: true,
      message: 'Stripe reconciliation endpoint is working',
      receivedKey: stripeApiKey ? 'Key received (hidden for security)' : 'No key received'
    });
  } catch (error: unknown) {
    console.error('Error in minimal endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ 
      error: 'An error occurred',
      details: errorMessage 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Minimal backend server running on http://localhost:${port}`);
  console.log(`Test with: curl -X POST http://localhost:${port}/api/reconcile/invoices -H "x-stripe-key: your_key_here"`);
});
