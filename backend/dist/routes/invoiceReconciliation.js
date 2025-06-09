import { Router } from 'express';
import { ApiReconciliationService } from '../services/apiReconciliationService.js';
const router = Router();
const reconciliationService = new ApiReconciliationService();
router.post('/api/reconcile', async (req, res) => {
    try {
        const { startDate, endDate, matchThreshold, customerName, status } = req.body;
        // Validate input
        if (startDate && isNaN(Date.parse(startDate))) {
            return res.status(400).json({ error: 'Invalid startDate format' });
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            return res.status(400).json({ error: 'Invalid endDate format' });
        }
        if (matchThreshold && (matchThreshold < 0 || matchThreshold > 1)) {
            return res.status(400).json({ error: 'matchThreshold must be between 0 and 1' });
        }
        // Perform reconciliation using the new service
        const result = await reconciliationService.reconcileInvoices({
            startDate,
            endDate,
            matchThreshold,
            customerName,
            status
        });
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error during invoice reconciliation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reconcile invoices',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
export default router;
