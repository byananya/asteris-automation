import { Router } from 'express';
import { apiReconciliationService } from '../services/apiReconciliationService';
import logger from '../utils/logger';
import Stripe from 'stripe';

const router = Router();

// Initialize Stripe with environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

/**
 * @swagger
 * /api/reconcile/invoices:
 *   get:
 *     summary: Get a list of invoices with optional filtering
 *     tags: [Reconciliation]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering invoices (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering invoices (YYYY-MM-DD)
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *         description: Filter by customer email or ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, open, paid, uncollectible, void]
 *         description: Filter by invoice status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of invoices to return
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StripeInvoice'
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.get('/invoices', async (req, res) => {
    try {
        const { startDate, endDate, customer, status, limit = '10' } = req.query;
        const limitNum = Math.min(parseInt(limit as string, 10) || 10, 100);
        
        // Build query parameters
        const params: Stripe.InvoiceListParams = {
            limit: limitNum,
        };
        
        // Add optional filters
        if (status) params.status = status as Stripe.InvoiceListParams.Status;
        if (customer) params.customer = customer as string;
        
        // Add date range if provided
        if (startDate || endDate) {
            params.created = {};
            if (startDate) params.created.gte = Math.floor(new Date(startDate as string).getTime() / 1000);
            if (endDate) params.created.lte = Math.ceil(new Date(endDate as string).getTime() / 1000);
        }
        
        // Fetch invoices from Stripe
        const invoices = await stripe.invoices.list(params);
        
        res.json({
            success: true,
            data: invoices.data,
            has_more: invoices.has_more
        });
        
    } catch (error) {
        logger.error('Error fetching invoices:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invoices',
            details: errorMessage
        });
    }
});

/**
 * @swagger
 * /api/reconcile/invoices:
 *   post:
 *     summary: Reconcile invoices with payouts
 *     tags: [Reconciliation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, endDate]
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
        
        // Validate required fields
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                success: false,
                error: 'startDate and endDate are required' 
            });
        }
        
        // Validate date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD' 
            });
        }
        
        if (start > end) {
            return res.status(400).json({ 
                success: false,
                error: 'startDate must be before or equal to endDate' 
            });
        }
        
        // Validate matchThreshold if provided
        if (matchThreshold && (matchThreshold < 0.5 || matchThreshold > 1)) {
            return res.status(400).json({ 
                success: false,
                error: 'matchThreshold must be between 0.5 and 1.0' 
            });
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
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        logger.error('Error during reconciliation:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during reconciliation';
        res.status(500).json({ 
            success: false,
            error: 'Failed to reconcile invoices', 
            details: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
});

// Add a simple health check endpoint for the reconciliation service
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'reconciliation',
        timestamp: new Date().toISOString()
    });
});

export default router;
