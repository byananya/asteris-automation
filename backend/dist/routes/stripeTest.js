import { Router } from 'express';
import { ApiReconciliationService } from '../services/apiReconciliationService.js';
import { StripeService } from '../services/stripeService.js';
const router = Router();
const stripeService = new StripeService();
const reconciliationService = new ApiReconciliationService();
// Test endpoint to verify Stripe integration
router.get('/api/test/stripe', async (req, res) => {
    try {
        // Test Stripe connection by fetching a small number of invoices and payouts
        const [invoices, payouts] = await Promise.all([
            stripeService.getAllInvoices({ limit: 5 }),
            stripeService.getAllPayouts({ limit: 5 })
        ]);
        // Get recent invoices and payouts for testing
        const testInvoices = await stripeService.getAllInvoices({
            limit: 10 // Limit to 10 invoices for testing
        });
        // Get recent payouts for testing
        const testPayouts = await stripeService.getAllPayouts({
            limit: 10 // Limit to 10 payouts for testing
        });
        // Perform a test reconciliation with the limited dataset
        const reconciliationResult = reconciliationService.processReconciliation(testInvoices, testPayouts);
        res.json({
            success: true,
            stripeConnection: {
                invoices: invoices.length,
                payouts: payouts.length,
                hasApiKey: !!process.env.STRIPE_SECRET_KEY,
            },
            reconciliation: {
                totalInvoices: reconciliationResult.summary.totalInvoices,
                matchedInvoices: reconciliationResult.summary.matchedInvoices,
                matchRate: reconciliationResult.summary.matchRate,
                processingTime: reconciliationResult.summary.processingTime,
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Stripe test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test Stripe integration',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
export default router;
