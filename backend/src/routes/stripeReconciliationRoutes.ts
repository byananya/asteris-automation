import { Router, Request, Response } from 'express';
import { StripeReconciliationService } from '../services/stripeReconciliationService.js';

const router = Router();

router.post('/reconcile', async (req: Request, res: Response) => {
  try {
    const stripeApiKey = req.headers['x-stripe-key'];
    const { startDate, endDate } = req.body;

    if (!stripeApiKey || typeof stripeApiKey !== 'string' || !stripeApiKey.startsWith('sk_')) {
      return res.status(400).json({ error: 'A valid Stripe secret API key (sk_...) is required in the x-stripe-key header.' });
    }

    const service = new StripeReconciliationService(stripeApiKey);
    const results = await service.runReconciliation(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return res.json(results);

  } catch (error) {
    console.error('Stripe Reconciliation API Error:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'An unexpected error occurred during reconciliation.' });
  }
});

export default router; 