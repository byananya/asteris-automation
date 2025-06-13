import express from 'express';
import cors from 'cors';

const app = express();
const port = 3002;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-stripe-key'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Minimal Stripe reconciliation endpoint
app.post('/api/reconcile/invoices', async (req: express.Request, res: express.Response) => {
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
