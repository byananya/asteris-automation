import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { StripeService } from './stripeService.js';
const stripeService = new StripeService();
export class ApiReconciliationService {
    async reconcileInvoices(params = {}) {
        const startTime = process.hrtime();
        try {
            logger.info('Starting invoice reconciliation...');
            // Get all invoices and payouts from Stripe
            const [invoices, payouts] = await Promise.all([
                stripeService.getAllInvoices(),
                stripeService.getAllPayouts()
            ]);
            // Filter out non-paid invoices and process only paid ones
            const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
            return this.processReconciliation(paidInvoices, payouts, startTime);
        }
        catch (error) {
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
    processReconciliation(invoices, payouts, startTime = process.hrtime()) {
        const matches = [];
        const issues = [];
        let matchedCount = 0;
        let matchedAmount = 0;
        let unmatchedCount = 0;
        let unmatchedAmount = 0;
        // Process each invoice
        invoices.forEach((invoice) => {
            // Get payment intent ID from invoice
            const paymentIntentId = typeof invoice.payment_intent === 'string'
                ? invoice.payment_intent
                : invoice.payment_intent?.id;
            // Get invoice amount in dollars
            const invoiceAmount = (invoice.amount_paid || 0) / 100;
            // Find matching payout by invoice ID or payment intent ID in metadata
            const matchingPayout = payouts.find(payout => {
                const metadata = payout.metadata || {};
                return metadata.invoice_id === invoice.id ||
                    metadata.payment_intent === paymentIntentId;
            });
            // Get customer name from invoice
            const customerName = invoice.customer_name ||
                (typeof invoice.customer_email === 'string' ?
                    invoice.customer_email : 'Unknown');
            // Create match result
            // Create a safe match object with proper type assertions and fallbacks
            const match = {
                invoiceId: invoice.id, // Required by Stripe API
                payoutId: matchingPayout?.id || null,
                invoiceAmount: invoiceAmount || 0,
                payoutAmount: matchingPayout ? matchingPayout.amount / 100 : 0,
                fee: matchingPayout ? (matchingPayout.fee_details?.[0]?.amount || 0) / 100 : 0,
                status: matchingPayout ? 'matched' : 'unmatched',
                confidence: matchingPayout ? 1 : 0,
                invoiceNumber: invoice.number || undefined,
                customerName: customerName || 'Unknown Customer',
                issueDate: invoice.created ? new Date(invoice.created * 1000).toISOString() : new Date().toISOString(),
                dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : undefined,
                invoiceStatus: invoice.status || undefined,
                payoutDate: matchingPayout?.arrival_date
                    ? new Date(matchingPayout.arrival_date * 1000).toISOString()
                    : undefined,
                payoutStatus: matchingPayout?.status,
                currency: invoice.currency?.toUpperCase(),
                description: invoice.description || undefined
            };
            if (matchingPayout) {
                matchedCount++;
                matchedAmount += match.invoiceAmount;
            }
            else {
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
