import { Router, Request, Response, NextFunction } from 'express';
import { apiReconciliationService } from '../services/apiReconciliationService';
import { StripeService } from '../services/stripeService';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      stripeService: StripeService;
    }
  }
}

const router = Router();

// Create a map to store Stripe service instances by API key
const stripeServiceCache = new Map<string, StripeService>();

// Middleware to get or create Stripe service instance
const getStripeService = (req: Request, res: Response, next: NextFunction) => {
  const stripeKey = req.headers['x-stripe-key'] as string || '';
  
  if (!stripeKey) {
    return res.status(400).json({
      success: false,
      error: 'Stripe API key is required in x-stripe-key header',
    });
  }

  // Get or create Stripe service instance
  if (!stripeServiceCache.has(stripeKey)) {
    try {
      const stripeService = new StripeService(stripeKey);
      stripeServiceCache.set(stripeKey, stripeService);
      logger.info('Created new Stripe service instance');
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Stripe API key',
      });
    }
  }

  req.stripeService = stripeServiceCache.get(stripeKey)!;
  next();
};

// Apply Stripe service middleware to all reconciliation routes
router.use(getStripeService);

/**
 * @swagger
 * /api/reconcile/invoices:
 *   get:
 *     summary: Get a list of invoices with optional filtering
 *     tags: [Reconciliation]
 *     parameters:
 *       - in: header
 *         name: x-stripe-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe API key with read access
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
 *         name: customerName
 *         schema:
 *           type: string
 *         description: Filter invoices by customer name
 *     responses:
 *       200:
 *         description: A list of invoices
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       amount_due:
 *                         type: number
 *                       amount_paid:
 *                         type: number
 *                       customer_name:
 *                         type: string
 *                       created:
 *                         type: number
 *                       status:
 *                         type: string
 *       400:
 *         description: Invalid parameters or missing API key
 *       500:
 *         description: Server error
 */
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, customerName } = req.query;
    const { stripeService } = req;
    
    // Validate date range if both dates are provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Please use YYYY-MM-DD'
        });
      }
      
      // Validate date range (max 1 year)
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > oneYearInMs) {
        return res.status(400).json({
          success: false,
          error: 'Date range cannot exceed 1 year'
        });
      }
    }
    
    // Get invoices using the Stripe service from the request
    const invoices = await stripeService.getInvoices(100);
    
    // Apply filters
    let filteredInvoices = [...invoices];
    
    if (startDate) {
      const startTimestamp = Math.floor(new Date(startDate as string).getTime() / 1000);
      filteredInvoices = filteredInvoices.filter(
        inv => inv.created && inv.created >= startTimestamp
      );
    }
    
    if (endDate) {
      const endTimestamp = Math.floor(new Date(endDate as string).getTime() / 1000);
      filteredInvoices = filteredInvoices.filter(
        inv => inv.created && inv.created <= endTimestamp
      );
    }
    
    if (customerName) {
      const searchTerm = (customerName as string).toLowerCase();
      filteredInvoices = filteredInvoices.filter(
        inv => inv.customer_name && 
               inv.customer_name.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      success: true,
      data: filteredInvoices
    });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/reconcile/invoices:
 *   post:
 *     summary: Reconcile invoices with payouts
 *     tags: [Reconciliation]
 *     parameters:
 *       - in: header
 *         name: x-stripe-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe API key with read access
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
 *                 description: Start date for reconciliation (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for reconciliation (YYYY-MM-DD)
 *               matchThreshold:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 1
 *                 default: 0.9
 *                 description: Confidence threshold for matching
 *               customerName:
 *                 type: string
 *                 description: Filter by customer name
 *               status:
 *                 type: string
 *                 description: Filter by invoice status
 *     responses:
 *       200:
 *         description: Reconciliation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid parameters or missing API key
 *       500:
 *         description: Server error
 */
router.post('/invoices', async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substring(2, 9);
  const logContext = { requestId };
  
  logger.info('Starting invoice reconciliation request', { 
    ...logContext,
    hasStartDate: !!req.body.startDate,
    hasEndDate: !!req.body.endDate,
    hasStripeKey: !!req.headers['x-stripe-key']
  });
  
  try {
    const { startDate, endDate, matchThreshold, customerName, status } = req.body;
    const { stripeService } = req;
    
    // Log the incoming request details
    logger.debug('Request details', { 
      ...logContext,
      startDate,
      endDate,
      matchThreshold,
      customerNameLength: customerName ? customerName.length : 0,
      status
    });
    
    // Validate required fields
    if (!startDate || !endDate) {
      const errorMsg = 'startDate and endDate are required';
      logger.warn('Validation failed', { ...logContext, error: errorMsg });
      return res.status(400).json({
        success: false,
        error: errorMsg
      });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Please use YYYY-MM-DD'
      });
    }
    
    // Validate date range (max 1 year)
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYearInMs) {
      return res.status(400).json({
        success: false,
        error: 'Date range cannot exceed 1 year'
      });
    }
    
    // Validate match threshold
    if (matchThreshold && (matchThreshold < 0.5 || matchThreshold > 1)) {
      return res.status(400).json({
        success: false,
        error: 'matchThreshold must be between 0.5 and 1.0'
      });
    }
    
    // Call the reconciliation service with the Stripe service
    const result = await apiReconciliationService.reconcileInvoices({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      matchThreshold,
      customerName,
      status,
      stripeService
    });
    
    // Log successful reconciliation
    logger.info('Successfully completed reconciliation', { 
      ...logContext,
      matchedInvoices: result?.summary?.matchedInvoices,
      totalInvoices: result?.summary?.totalInvoices
    });
    
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Error during reconciliation', { 
      ...logContext,
      error: errorMessage,
      stack: errorStack,
      errorDetails: error
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to reconcile invoices',
      details: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : errorMessage,
      requestId
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
