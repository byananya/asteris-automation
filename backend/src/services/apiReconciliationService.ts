import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import 'uuid'; // Ensure types are loaded
import { StripeService } from './stripeService.js';

const stripeService = new StripeService();
import Stripe from 'stripe';

// Extend the Stripe Invoice type to include payment_intent
declare module 'stripe' {
  namespace Stripe {
    interface Invoice {
      payment_intent?: string | Stripe.PaymentIntent;
    }
  }
}

export interface MatchResult {
  invoiceId: string;
  payoutId: string | null;
  invoiceAmount: number;
  payoutAmount: number;
  fee: number;
  status: 'matched' | 'partial' | 'unmatched';
  confidence: number;
  invoiceNumber?: string;
  customerName?: string;
  issueDate?: string;
  dueDate?: string;
  invoiceStatus?: string;
  payoutDate?: string;
  payoutStatus?: string;
  currency?: string;
  description?: string;
}

export interface ReconciliationParams {
  startDate?: string;
  endDate?: string;
  matchThreshold?: number;
  customerName?: string;
  status?: string;
}

export interface ReconciliationResult {
  id: string;
  timestamp: string;
  summary: {
    totalInvoices: number;
    matchedInvoices: number;
    unmatchedInvoices: number;
    totalAmount: number;
    matchedAmount: number;
    unmatchedAmount: number;
    processingTime: string;
    matchRate: number;
  };
  matches: MatchResult[];
  issues: Array<{
    type: string;
    count: number;
    totalAmount: number;
    message: string;
  }>;
}

export class ApiReconciliationService {
  async reconcileInvoices(params: ReconciliationParams = {}): Promise<ReconciliationResult> {
    const startTime = process.hrtime();
    
    try {
      logger.info('Starting invoice reconciliation...');
      
      // Get all invoices and payouts from Stripe
      logger.info('Fetching invoices and payouts from Stripe...');
      const [invoices, payouts] = await Promise.all([
        stripeService.getAllInvoices(),
        stripeService.getAllPayouts()
      ]);
      
      logger.info(`Fetched ${invoices.length} invoices and ${payouts.length} payouts`);
      
      // Log first few invoices for debugging
      if (invoices.length > 0) {
        logger.info('Sample invoice:', {
          id: invoices[0].id,
          status: invoices[0].status,
          amount_paid: invoices[0].amount_paid,
          customer_email: (invoices[0] as any).customer_email,
          created: invoices[0].created,
          payment_intent: invoices[0].payment_intent
        });
      } else {
        logger.warn('No invoices found in Stripe account');
      }
      
      // Filter out non-paid invoices and process only paid ones
      const paidInvoices = invoices.filter((invoice: Stripe.Invoice) => {
        const isPaid = invoice.status === 'paid';
        if (!isPaid) {
          logger.debug(`Skipping invoice ${invoice.id} with status: ${invoice.status}`);
        }
        return isPaid;
      });
      
      logger.info(`Found ${paidInvoices.length} paid invoices to reconcile`);
      
      return this.processReconciliation(paidInvoices, payouts, startTime);
    } catch (error) {
      logger.error('Error during invoice reconciliation:', error);
      throw error;
    }
  }

  /**
   * Process reconciliation between invoices and payouts
   * @param invoices Array of Stripe invoices
   * @param payouts Array of Stripe payouts
   * @param startTime The start time of the reconciliation process (from process.hrtime())
   * @returns Reconciliation result with matches, issues, and summary
   */
  public processReconciliation(
    invoices: Stripe.Invoice[],
    payouts: Stripe.Payout[],
    startTime: [number, number] = process.hrtime()
  ): ReconciliationResult {
    const matches: MatchResult[] = [];
    const issues: Array<{
      type: string;
      count: number;
      totalAmount: number;
      message: string;
    }> = [];
    
    let matchedCount = 0;
    let matchedAmount = 0;
    let unmatchedCount = 0;
    let unmatchedAmount = 0;
    
    // Process each invoice
    invoices.forEach((invoice: Stripe.Invoice) => {
      // Get payment intent ID from invoice
      const paymentIntentId = typeof invoice.payment_intent === 'string' 
        ? invoice.payment_intent 
        : (invoice.payment_intent as any)?.id;
      
      // Get invoice amount in dollars
      const invoiceAmount = (invoice.amount_paid || 0) / 100;
      
      // Find matching payout by invoice ID or payment intent ID in metadata
      const matchingPayout = payouts.find(payout => {
        const metadata = payout.metadata || {};
        return metadata.invoice_id === invoice.id || 
               metadata.payment_intent === paymentIntentId;
      });
      
      // Get customer name from invoice
      const customerName = (invoice as any).customer_name || 
                         (typeof invoice.customer_email === 'string' ? 
                          invoice.customer_email : 'Unknown');
      
      // Create match result
      // Create a safe match object with proper type assertions and fallbacks
      const match: MatchResult = {
        invoiceId: invoice.id as string, // Required by Stripe API
        payoutId: matchingPayout?.id || null,
        invoiceAmount: invoiceAmount || 0,
        payoutAmount: matchingPayout ? matchingPayout.amount / 100 : 0,
        fee: matchingPayout ? ((matchingPayout as any).fee_details?.[0]?.amount || 0) / 100 : 0,
        status: matchingPayout ? 'matched' : 'unmatched',
        confidence: matchingPayout ? 1 : 0,
        invoiceNumber: invoice.number || undefined,
        customerName: customerName || 'Unknown Customer',
        issueDate: invoice.created ? new Date(invoice.created * 1000).toISOString() : new Date().toISOString(),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : undefined,
        invoiceStatus: (invoice.status as string) || undefined,
        payoutDate: matchingPayout?.arrival_date 
          ? new Date((matchingPayout as any).arrival_date * 1000).toISOString() 
          : undefined,
        payoutStatus: matchingPayout?.status as string | undefined,
        currency: (invoice.currency as string)?.toUpperCase(),
        description: (invoice.description as string) || undefined
      };
      
      if (matchingPayout) {
        matchedCount++;
        matchedAmount += match.invoiceAmount;
      } else {
        unmatchedCount++;
        unmatchedAmount += match.invoiceAmount;
        
        // Log issue for unmatched invoice
        issues.push({
          type: 'unmatched_invoice',
          count: 1,
          totalAmount: match.invoiceAmount,
          message: `No matching payout found for invoice ${match.invoiceNumber || match.invoiceId} (${match.invoiceAmount})`
        });
      }
      
      matches.push(match);
    });

    // Process remaining unmatched payouts
    payouts.forEach(payout => {
      // Skip payouts that were already matched to invoices
      if (matches.some(m => m.payoutId === payout.id)) {
        return;
      }

      issues.push({
        type: 'unmatched_payout',
        count: 1,
        totalAmount: payout.amount / 100, // Convert to dollars
        message: `No matching invoice found for payout ${payout.id} (${payout.amount / 100})`
      });
    });

    // Calculate summary
    const endTime = process.hrtime(startTime);
    const processingTime = `${(endTime[0] * 1000 + endTime[1] / 1e6).toFixed(2)}ms`;
    const totalInvoices = invoices.length;
    const matchRate = totalInvoices > 0 ? (matchedCount / totalInvoices) * 100 : 0;

    // Create result
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      summary: {
        totalInvoices,
        matchedInvoices: matchedCount,
        unmatchedInvoices: unmatchedCount,
        totalAmount: matchedAmount + unmatchedAmount,
        matchedAmount,
        unmatchedAmount,
        processingTime,
        matchRate: parseFloat(matchRate.toFixed(2))
      },
      matches,
      issues
    };
  }
}

export const apiReconciliationService = new ApiReconciliationService();
