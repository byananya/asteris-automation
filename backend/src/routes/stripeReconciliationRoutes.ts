import { Router, Request, Response } from 'express';
import { StripeReconciliationService } from '../services/stripeReconciliationService';

const router = Router();

router.post('/invoices', async (req: Request, res: Response) => {
  try {
    const stripeApiKey = req.headers['x-stripe-key'] as string;
    const { startDate, endDate } = req.body;

    if (!stripeApiKey || !stripeApiKey.startsWith('sk_')) {
      return res.status(400).json({ 
        error: 'A valid Stripe secret API key (sk_...) is required in the x-stripe-key header.' 
      });
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
    return res.status(500).json({ error: 'An unknown error occurred during reconciliation' });
  }
});

export default router;