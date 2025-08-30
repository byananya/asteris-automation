import Stripe from 'stripe';
import { format } from 'date-fns';

const STRIPE_API_VERSION = '2025-06-30.basil' as const;

type StripeInvoiceWithCharge = Stripe.Invoice & { charge?: string };

interface ReconciliationRecord {
  invoiceId: string;
  customerId: string;
  customerEmail: string;
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

interface ReconciliationResult {
  records: ReconciliationRecord[];
  summary: ReconciliationSummary;
}

export class StripeReconciliationService {
  private getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string {
    if (typeof customer === 'string') return customer;
    if (customer?.id) return customer.id;
    return '';
  }

  private stripe: Stripe;
  private lastRunTime?: Date;

  constructor(apiKey: string) {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      throw new Error('Invalid Stripe API key provided');
    }
    this.stripe = new Stripe(apiKey, {
      // @ts-ignore - The type definition is incorrect for the API version
      apiVersion: STRIPE_API_VERSION,
    });
  }

  async generateCSV(records: ReconciliationRecord[]): Promise<string> {
    const headers = [
      'Invoice ID',
      'Customer ID',
      'Customer Email',
      'Invoice Amount',
      'Charge ID',
      'Gross Amount',
      'Fee',
      'Net Amount',
      'Date',
      'Currency'
    ];

    const rows = records.map(record => [
      record.invoiceId,
      record.customerId,
      record.customerEmail,
      record.invoiceAmount.toFixed(2),
      record.chargeId,
      record.grossAmount.toFixed(2),
      record.fee.toFixed(2),
      record.netAmount.toFixed(2),
      record.date,
      record.currency
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  private async fetchInvoices(startDate?: Date, endDate: Date = new Date()): Promise<StripeInvoiceWithCharge[]> {
    const invoices: StripeInvoiceWithCharge[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const response = await this.stripe.invoices.list({
        limit: 100,
        status: 'paid',
        created: {
          gte: startDate?.getTime() ? Math.floor(startDate.getTime() / 1000) : undefined,
          lte: Math.floor(endDate.getTime() / 1000)
        },
        starting_after: startingAfter,
        expand: ['data.charge', 'data.customer']
      });

      invoices.push(...response.data as StripeInvoiceWithCharge[]);
      hasMore = response.has_more;
      startingAfter = response.data[response.data.length - 1]?.id;
    }

    return invoices;
  }

  async runReconciliation(startDate?: Date, endDate: Date = new Date()): Promise<ReconciliationResult> {
    try {
      // Store this run time for future delta loads
      this.lastRunTime = new Date();

      const invoices = await this.fetchInvoices(startDate, endDate);
      const records: ReconciliationRecord[] = [];
      let totalGross = 0;
      let totalFees = 0;
      let totalNet = 0;

      for (const invoice of invoices) {
        if (!invoice.charge) continue;

        const charge = await this.stripe.charges.retrieve(invoice.charge);
        if (!charge.balance_transaction) continue;

        const balanceTransaction = await this.stripe.balanceTransactions.retrieve(
          charge.balance_transaction as string
        );

        const record: ReconciliationRecord = {
          invoiceId: String(invoice.id),
          customerId: this.getCustomerId(invoice.customer),
          customerEmail: invoice.customer_email?.toString() ?? '',
          invoiceAmount: invoice.amount_paid / 100,
          chargeId: charge.id,
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
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to run reconciliation');
    }
  }
}
