import Stripe from 'stripe';
import { format } from 'date-fns';

const STRIPE_API_VERSION = '2025-08-27.basil' as const;

// Define an expanded Invoice type to include the 'charge' object
interface ExpandedInvoice extends Stripe.Invoice {
  charge: Stripe.Charge | null; // Explicitly define charge as an object or null
}

interface ReconciliationRecord {
  invoiceId: string;
  customerId: string;
  customerEmail?: string; // Made optional with ?
  invoiceAmount: number;
  chargeId: string;
  grossAmount: number;
  fee: number;
  netAmount: number;
  date: string;
  currency: string;
}

interface ReconciliationSummary {
  totalGross: number;
  totalFees: number;
  totalNet: number;
  recordCount: number;
}

export interface ReconciliationResult {
  records: ReconciliationRecord[];
  summary: ReconciliationSummary;
}

export class StripeReconciliationService {
  private stripe: Stripe;
  
  constructor(apiKey: string) {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      throw new Error('Invalid Stripe API key provided');
    }
    this.stripe = new Stripe(apiKey, {
      // @ts-ignore - The type definition is incorrect for the API version
      apiVersion: STRIPE_API_VERSION,
    });
  }

  private getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string {
    if (!customer) return 'unknown-customer';
    if (typeof customer === 'string') return customer || 'unknown-customer';
    if ('id' in customer && typeof customer.id === 'string' && customer.id) {
      return customer.id;
    }
    return 'unknown-customer';
  }

  private async fetchInvoices(startDate?: Date, endDate: Date = new Date()): Promise<ExpandedInvoice[]> {
    const invoices: ExpandedInvoice[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const response = await this.stripe.invoices.list({
        limit: 100,
        status: 'paid',
        created: {
          gte: startDate ? Math.floor(startDate.getTime() / 1000) : undefined,
          lte: Math.floor(endDate.getTime() / 1000)
        },
        starting_after: startingAfter,
        expand: ['data.charge', 'data.customer'] // Expand charge and customer objects
      });

      // Type assertion for each invoice to ExpandedInvoice
      invoices.push(...(response.data as ExpandedInvoice[]));
      hasMore = response.has_more;
      startingAfter = response.data[response.data.length - 1]?.id;
    }
    return invoices;
  }

  public async runReconciliation(startDate?: Date, endDate: Date = new Date()): Promise<ReconciliationResult> {
    try {
      const invoices = await this.fetchInvoices(startDate, endDate);
      const records: ReconciliationRecord[] = [];
      let totalGross = 0;
      let totalFees = 0;
      let totalNet = 0;

      for (const invoice of invoices) {
        // Now, invoice.charge is already typed as Stripe.Charge | null
        if (!invoice.charge) {
            continue; // Skip if charge is not present or null
        }

        const charge = invoice.charge;
        if (!charge.balance_transaction) continue; // Skip if no balance transaction

        const balanceTransaction = await this.stripe.balanceTransactions.retrieve(
          charge.balance_transaction as string
        );

        // Ensure all required fields are properly typed and non-null
        const record: ReconciliationRecord = {
          invoiceId: String(invoice.id), // Ensure id is a string
          customerId: this.getCustomerId(invoice.customer),
          // Explicitly handle the customer email assignment
          ...(invoice.customer_email ? { customerEmail: invoice.customer_email } : {}),
          invoiceAmount: invoice.amount_due / 100, // Or amount_paid if you only want paid invoices
          chargeId: String(charge.id), // Ensure charge.id is a string
          grossAmount: balanceTransaction.amount / 100,
          fee: Math.abs(balanceTransaction.fee) / 100,
          netAmount: balanceTransaction.net / 100,
          date: format(new Date(invoice.created * 1000), 'yyyy-MM-dd'),
          currency: invoice.currency.toUpperCase()
        };

        records.push(record);
        totalGross += record.grossAmount;
        totalFees += record.fee;
        totalNet += record.netAmount;
      }

      const summary: ReconciliationSummary = {
        totalGross,
        totalFees,
        totalNet,
        recordCount: records.length
      };

      return {
        records,
        summary
      };
    } catch (error) {
      console.error('Error during Stripe reconciliation:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to run Stripe reconciliation');
    }
  }
} 