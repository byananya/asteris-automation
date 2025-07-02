import Stripe from 'stripe';
import logger from '../utils/logger.js';

export class StripeService {
  private stripe: Stripe | null = null;
  private isEnabled: boolean = false;

  constructor(apiKey?: string) {
    const stripeKey = apiKey || process.env.STRIPE_SECRET_KEY;
    
    if (stripeKey) {
      try {
        this.stripe = new Stripe(stripeKey, {
          // Using the correct API version for the Stripe SDK
          // @ts-ignore - The type definition is incorrect for the API version
          apiVersion: '2025-06-30.basil' as const,
          typescript: true
        });
        this.isEnabled = true;
        logger.info('Stripe service initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Stripe service:', error);
        throw new Error('Invalid Stripe API key');
      }
    } else {
      logger.warn('No Stripe API key provided. Stripe functionality will be disabled.');
    }
  }

  get isActive(): boolean {
    return this.isEnabled && this.stripe !== null;
  }

  /**
   * Get the Stripe client instance
   * @returns The Stripe client instance or null if not initialized
   */
  getStripeClient(): Stripe | null {
    return this.stripe;
  }

  async getInvoices(
    limit = 100, 
    startingAfter?: string,
    filters?: Stripe.InvoiceListParams
  ): Promise<Stripe.Invoice[]> {
    if (!this.isActive || !this.stripe) {
      logger.warn('Stripe is not configured. Returning empty invoice list.');
      return [];
    }

    try {
      const params: Stripe.InvoiceListParams = {
        limit,
        expand: ['data.payment_intent', 'data.charge'] as any[],
        ...filters, // Spread any additional filters
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      logger.debug('Fetching invoices with params:', params);
      const invoices = await this.stripe.invoices.list(params);
      logger.debug(`Fetched ${invoices.data.length} invoices`);
      
      return invoices.data;
    } catch (error) {
      logger.error('Error fetching Stripe invoices:', error);
      throw error;
    }
  }

  async getInvoice(id: string): Promise<Stripe.Invoice | null> {
    if (!this.isActive || !this.stripe) {
      logger.warn('Stripe is not configured. Cannot retrieve invoice.');
      return null;
    }
    
    try {
      return await this.stripe.invoices.retrieve(id, {
        expand: ['payment_intent', 'charge']
      });
    } catch (error) {
      logger.error('Error fetching Stripe invoice:', error);
      throw error;
    }
  }

  async getPayouts(limit = 100, startingAfter?: string): Promise<Stripe.Payout[]> {
    if (!this.isActive || !this.stripe) {
      logger.warn('Stripe is not configured. Returning empty payout list.');
      return [];
    }

    try {
      const params: Stripe.PayoutListParams = {
        limit,
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const payouts = await this.stripe.payouts.list(params);
      return payouts.data;
    } catch (error) {
      logger.error('Error fetching Stripe payouts:', error);
      throw error;
    }
  }

  async getAllInvoices(params: { 
    limit?: number;
    filters?: Stripe.InvoiceListParams;
  } = {}): Promise<Stripe.Invoice[]> {
    let allInvoices: Stripe.Invoice[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    let fetchedCount = 0;
    const limit = params.limit || Infinity;
    const { filters = {} } = params;

    if (!this.isActive || !this.stripe) {
      logger.warn('Stripe is not active. Cannot fetch invoices.');
      return [];
    }

    try {
      logger.info('Fetching invoices from Stripe...', { 
        limit,
        hasFilters: !!Object.keys(filters).length
      });
      
      while (hasMore && fetchedCount < limit) {
        const fetchLimit = Math.min(100, limit - fetchedCount);
        const listParams: Stripe.InvoiceListParams = {
          limit: fetchLimit,
          expand: ['data.payment_intent', 'data.charge'],
          ...filters, // Apply any additional filters
          ...(startingAfter ? { starting_after: startingAfter } : {})
        };
        
        logger.debug('Making request to Stripe API for invoices', { 
          fetchLimit,
          startingAfter: startingAfter ? '...' + startingAfter.slice(-8) : 'none',
          fetchedSoFar: fetchedCount,
          hasDateFilter: !!(filters as any)?.created
        });

        const invoices = await this.stripe.invoices.list(listParams);
        const batchCount = invoices.data.length;
        logger.debug(`Fetched ${batchCount} invoices in this batch`);
        
        allInvoices = [...allInvoices, ...invoices.data];
        fetchedCount += batchCount;

        hasMore = !!invoices.has_more && batchCount > 0 && fetchedCount < limit;
        if (hasMore && batchCount > 0) {
          startingAfter = invoices.data[batchCount - 1].id;
        }
      }
      
      logger.info(`Successfully fetched ${allInvoices.length} invoices from Stripe`);
      if (allInvoices.length > 0) {
        logger.debug('Sample invoice data:', {
          id: allInvoices[0].id,
          status: allInvoices[0].status,
          amount_paid: allInvoices[0].amount_paid,
          customer_email: (allInvoices[0] as any)?.customer_email,
          payment_intent: allInvoices[0].payment_intent
        });
      }
      
      return allInvoices;
    } catch (error) {
      logger.error('Error fetching invoices from Stripe:', error);
      throw error;
    }
  }

  async getAllPayouts(params: { limit?: number } = {}): Promise<Stripe.Payout[]> {
    let allPayouts: Stripe.Payout[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    let fetchedCount = 0;
    const limit = params.limit || Infinity;

    if (!this.isActive || !this.stripe) {
      logger.warn('Stripe is not active. Cannot fetch payouts.');
      return [];
    }

    try {
      logger.info('Fetching payouts from Stripe...');
      
      while (hasMore && fetchedCount < limit) {
        const fetchLimit = Math.min(100, limit - fetchedCount);
        const listParams: Stripe.PayoutListParams = {
          limit: fetchLimit,
          ...(startingAfter ? { starting_after: startingAfter } : {})
        };
        
        logger.debug('Making request to Stripe API for payouts', { 
          fetchLimit,
          startingAfter: startingAfter ? '...' + startingAfter.slice(-8) : 'none',
          fetchedSoFar: fetchedCount
        });

        const payouts = await this.stripe.payouts.list(listParams);
        allPayouts = [...allPayouts, ...payouts.data];
        fetchedCount += payouts.data.length;

        hasMore = !!payouts.has_more && payouts.data.length > 0 && fetchedCount < limit;
        if (hasMore && payouts.data.length > 0) {
          startingAfter = payouts.data[payouts.data.length - 1].id;
        }
      }

      return allPayouts;
    } catch (error) {
      logger.error('Error fetching payouts from Stripe:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
