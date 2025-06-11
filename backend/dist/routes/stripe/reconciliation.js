"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reconciliation_js_1 = require("../../services/stripe/reconciliation.js");
const router = (0, express_1.Router)();
// Get Stripe API key from request header
const getStripeKey = (req) => {
    const key = req.headers['x-stripe-key'];
    if (!key)
        throw new Error('Stripe API key is required');
    return key;
};
router.post('/reconcile', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const stripeApiKey = req.headers['x-stripe-key'];
        if (!stripeApiKey || typeof stripeApiKey !== 'string') {
            return res.status(400).json({ error: 'Valid Stripe API key is required in x-stripe-key header' });
        }
        const service = new reconciliation_js_1.StripeReconciliationService(stripeApiKey);
        const result = await service.runReconciliation(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : new Date());
        // Generate CSV
        const csv = await service.generateCSV(result.records);
        // Set CSV headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=reconciliation-${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    }
    catch (error) {
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
        const service = new reconciliation_js_1.StripeReconciliationService(apiKey);
        const result = await service.runReconciliation(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.json(result.summary);
    }
    catch (error) {
        console.error('Summary error:', error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unexpected error occurred' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=reconciliation.js.map