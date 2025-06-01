import { Router } from 'express';
import { StripeReconciliationService } from '../../services/stripe/reconciliation.js';

const router = Router();

// Get Stripe API key from request header
const getStripeKey = (req: any) => {
  const key = req.headers['x-stripe-key'];
  if (!key) throw new Error('Stripe API key is required');
  return key as string;
};

router.post('/reconcile', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const stripeApiKey = req.headers['x-stripe-key'];

    if (!stripeApiKey || typeof stripeApiKey !== 'string') {
      return res.status(400).json({ error: 'Valid Stripe API key is required in x-stripe-key header' });
    }

    const service = new StripeReconciliationService(stripeApiKey);
    const result = await service.runReconciliation(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : new Date()
    );

    // Generate CSV
    const csv = await service.generateCSV(result.records);

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reconciliation-${new Date().toISOString().split('T')[0]}.csv`
    );

    return res.send(csv);
  } catch (error) {
    console.error('Reconciliation error:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to run reconciliation' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const apiKey = getStripeKey(req);
    const { startDate, endDate } = req.query;
    
    const service = new StripeReconciliationService(apiKey);
    const result = await service.runReconciliation(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json(result.summary);
  } catch (error) {
    console.error('Summary error:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
});

export default router;
