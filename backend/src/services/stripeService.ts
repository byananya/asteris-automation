import Stripe from 'stripe';

export interface Logger {
  error: (message: string, ...meta: any[]) => void;
  warn: (message: string, ...meta: any[]) => void;
  info: (message: string, ...meta: any[]) => void;
  debug: (message: string, ...meta: any[]) => void;
  verbose: (message: string, ...meta: any[]) => void;
  silly: (message: string, ...meta: any[]) => void;
}

export class StripeService {
  private stripe: Stripe | null = null;
  private logger: Logger;

  constructor(stripeKey?: string, logger?: Logger) {
    this.logger = logger || console as unknown as Logger;
    this.initialize(stripeKey);
  }

  initialize(stripeKey?: string) {
    const key = stripeKey || process.env.STRIPE_SECRET_KEY;
    if (key) {
      this.stripe = new Stripe(key, {
        // @ts-ignore - The type definition is incorrect for the API version
        apiVersion: '2025-05-28.basil' as const, // Latest API version for Stripe v18.2.1
        typescript: true
      });
    } else if (process.env.NODE_ENV !== 'production') {
      this.logger.warn('Stripe is not initialized. Please provide a valid Stripe key.');
    }
  }

  private async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      this.logger.error('Stripe has not been initialized. Call initialize() first.');
      throw new Error('Stripe has not been initialized. Call initialize() first.');
    }
    return this.stripe;
  }

  async getInvoices(limit = 100, startingAfter?: string): Promise<Stripe.Invoice[]> {
    const stripe = await this.getStripe();
    try {
      const params: Stripe.InvoiceListParams = {
        limit,
        expand: ['data.payment_intent', 'data.charge'],
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const invoices = await stripe.invoices.list(params);
      return invoices.data;
    } catch (error) {
      this.logger.error('Error fetching Stripe invoices:', error);
      throw error;
    }
  }

  async getInvoice(id: string): Promise<Stripe.Invoice> {
    const stripe = await this.getStripe();
    try {
      return await stripe.invoices.retrieve(id, {
        expand: ['payment_intent', 'charge']
      });
    } catch (error) {
      this.logger.error('Error fetching Stripe invoice:', error);
      throw error;
    }
  }

  async getPayout(id: string): Promise<Stripe.Payout> {
    const stripe = await this.getStripe();
    try {
      return await stripe.payouts.retrieve(id, {
        expand: ['destination', 'balance_transaction']
      });
    } catch (error) {
      this.logger.error('Error fetching Stripe payout:', error);
      throw error;
    }
  }

  async getPayouts(limit = 100, startingAfter?: string): Promise<Stripe.Payout[]> {
    const stripe = await this.getStripe();
    try {
      const params: Stripe.PayoutListParams = {
        limit,
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const payouts = await stripe.payouts.list(params);
      return payouts.data;
    } catch (error) {
      this.logger.error('Error fetching Stripe payouts:', error);
      throw error;
    }
  }

  async createInvoice(payload: Stripe.InvoiceCreateParams): Promise<Stripe.Invoice> {
    const stripe = await this.getStripe();
    try {
      return await stripe.invoices.create(payload);
    } catch (error) {
      this.logger.error('Error creating Stripe invoice:', error);
      throw error;
    }
  }

  async updateInvoice(
    id: string,
    payload: Stripe.InvoiceUpdateParams
  ): Promise<Stripe.Invoice> {
    const stripe = await this.getStripe();
    try {
      return await stripe.invoices.update(id, payload);
    } catch (error) {
      this.logger.error('Error updating Stripe invoice:', error);
      throw error;
    }
  }

  async getAllInvoices(params: { limit?: number } = {}): Promise<Stripe.Invoice[]> {
    const stripe = await this.getStripe();
    let allInvoices: Stripe.Invoice[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    let fetchedCount = 0;
    const limit = params.limit || Infinity;

    try {
      while (hasMore && fetchedCount < limit) {
        const fetchLimit = Math.min(100, limit - fetchedCount);
        const invoices = await stripe.invoices.list({
          limit: fetchLimit,
          starting_after: startingAfter,
          expand: ['data.payment_intent', 'data.charge'],
        });

        allInvoices = allInvoices.concat(invoices.data);
        fetchedCount += invoices.data.length;
        hasMore = invoices.has_more && invoices.data.length > 0 && fetchedCount < limit;
        
        if (hasMore && invoices.data.length > 0) {
          startingAfter = invoices.data[invoices.data.length - 1].id;
        }
      }

      return allInvoices;
    } catch (error) {
      this.logger.error('Error fetching all invoices from Stripe:', error);
      throw error;
    }
  }

  async getAllPayouts(params: { limit?: number } = {}): Promise<Stripe.Payout[]> {
    const stripe = await this.getStripe();
    let allPayouts: Stripe.Payout[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    let fetchedCount = 0;
    const limit = params.limit || Infinity;

    try {
      this.logger.info('Fetching payouts from Stripe...');
      
      while (hasMore && fetchedCount < limit) {
        const fetchLimit = Math.min(100, limit - fetchedCount);
        const listParams: Stripe.PayoutListParams = {
          limit: fetchLimit,
          ...(startingAfter && { starting_after: startingAfter })
        };
        
        this.logger.debug('Making request to Stripe API for payouts', { 
          fetchLimit,
          startingAfter: startingAfter ? '...' + startingAfter.slice(-8) : 'none',
          fetchedSoFar: fetchedCount
        });

        const payouts = await stripe.payouts.list(listParams);
        allPayouts = [...allPayouts, ...payouts.data];
        fetchedCount += payouts.data.length;

        hasMore = payouts.has_more && payouts.data.length > 0 && fetchedCount < limit;
        if (hasMore && payouts.data.length > 0) {
          startingAfter = payouts.data[payouts.data.length - 1].id;
        }
      }

      return allPayouts;
    } catch (error) {
      this.logger.error('Error fetching payouts from Stripe:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
