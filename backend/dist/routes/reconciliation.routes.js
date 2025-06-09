import { Router } from 'express';
import { apiReconciliationService } from '../services/apiReconciliationService.js';
import { logger } from '../utils/logger.js';
const router = Router();
/**
 * @swagger
 * /api/reconcile/invoices:
 *   post:
 *     summary: Reconcile invoices with payouts
 *     tags: [Reconciliation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for filtering invoices (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for filtering invoices (YYYY-MM-DD)
 *               matchThreshold:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 1
 *                 default: 0.9
 *                 description: Confidence threshold for matching (0.5-1.0)
 *               customerName:
 *                 type: string
 *                 description: Filter by customer name
 *               status:
 *                 type: string
 *                 description: Filter by invoice status
 *     responses:
 *       200:
 *         description: Reconciliation results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReconciliationResult'
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error during reconciliation
 */
router.post('/invoices', async (req, res) => {
    try {
        const { startDate, endDate, matchThreshold, customerName, status } = req.body;
        // Validate date range if both are provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
            }
            if (start > end) {
                return res.status(400).json({ error: 'startDate must be before or equal to endDate' });
            }
        }
        // Validate matchThreshold if provided
        if (matchThreshold && (matchThreshold < 0.5 || matchThreshold > 1)) {
            return res.status(400).json({ error: 'matchThreshold must be between 0.5 and 1.0' });
        }
        logger.info('Starting invoice reconciliation', {
            startDate,
            endDate,
            matchThreshold,
            customerName: customerName ? 'filtered' : 'all',
            status: status || 'all'
        });
        // Use the API-based reconciliation service
        const result = await apiReconciliationService.reconcileInvoices({
            startDate,
            endDate,
            matchThreshold,
            customerName,
            status
        });
        logger.info('Invoice reconciliation completed', {
            invoiceCount: result.summary.totalInvoices,
            matchedCount: result.summary.matchedInvoices,
            processingTime: result.summary.processingTime
        });
        res.json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during reconciliation';
        logger.error('Error in API-based invoice reconciliation:', { error: errorMessage });
        res.status(500).json({
            error: 'Failed to reconcile invoices using API',
            details: errorMessage
        });
    }
});
export default router;
