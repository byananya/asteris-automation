import { Router, Request, Response } from 'express';
// import { StripeReconciliationService } from '../services/stripeReconciliationService.js';

const router = Router();

router.post('/reconcile', async (req: Request, res: Response) => {
  // Temporarily return dummy data to check if routing works
  return res.json({
    records: [
      {
        invoiceId: 'dummy_inv_001',
        customerId: 'dummy_cust_001',
        customerEmail: 'dummy@example.com',
        invoiceAmount: 100.00,
        chargeId: 'dummy_charge_001',
        grossAmount: 98.00,
        fee: 2.00,
        netAmount: 96.00,
        date: '2023-01-15',
        currency: 'USD',
      },
    ],
    summary: {
      totalGross: 98.00,
      totalFees: 2.00,
      totalNet: 96.00,
      recordCount: 1,
    },
  });

  // try {
  //   const stripeApiKey = req.headers['x-stripe-key'];
  //   const { startDate, endDate } = req.body;

  //   if (!stripeApiKey || typeof stripeApiKey !== 'string' || !stripeApiKey.startsWith('sk_')) {
  //     return res.status(400).json({ error: 'A valid Stripe secret API key (sk_...) is required in the x-stripe-key header.' });
  //   }

  //   const service = new StripeReconciliationService(stripeApiKey);
  //   const results = await service.runReconciliation(
  //     startDate ? new Date(startDate) : undefined,
  //     endDate ? new Date(endDate) : undefined
  //   );

  //   return res.json(results);

  // } catch (error) {
  //   console.error('Stripe Reconciliation API Error:', error);
  //   if (error instanceof Error) {
  //     return res.status(500).json({ error: error.message });
  //   }
  //   return res.status(500).json({ error: 'An unexpected error occurred during reconciliation.' });
  // }
});

export default router; 