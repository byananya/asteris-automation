import { Router, Request, Response } from 'express';
import { StripeReconciliationService } from '../services/stripeReconciliationService';

const router = Router();

router.post('/invoices', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;
    const stripeApiKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeApiKey || !stripeApiKey.startsWith('sk_')) {
      return res.status(500).json({ 
        error: 'Stripe secret API key is not configured on the server.' 
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