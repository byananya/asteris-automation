import Stripe from 'stripe';
import logger from '../utils/logger.js';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // @ts-ignore - The type definition is incorrect for the API version
      apiVersion: '2025-05-28.basil' as const, // Latest API version for Stripe v18.2.1
      typescript: true
    });
  }

  async getInvoices(limit = 100, startingAfter?: string): Promise<Stripe.Invoice[]> {
    try {
      const params: Stripe.InvoiceListParams = {
        limit,
        expand: ['data.payment_intent', 'data.charge'],
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const invoices = await this.stripe.invoices.list(params);
      return invoices.data;
    } catch (error) {
      logger.error('Error fetching Stripe invoices:', error);
      throw error;
    }
  }

  async getPayouts(limit = 100, startingAfter?: string): Promise<Stripe.Payout[]> {
    try {
      const params: Stripe.PayoutListParams = {
        limit,
        expand: ['data.destination'],
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

  async getAllInvoices(params: { limit?: number } = {}): Promise<Stripe.Invoice[]> {
    let allInvoices: Stripe.Invoice[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    let fetchedCount = 0;
    const limit = params.limit || Infinity;

    try {
      while (hasMore && fetchedCount < limit) {
        const fetchLimit = Math.min(100, limit - fetchedCount);
        const listParams: Stripe.InvoiceListParams = {
          limit: fetchLimit,
          ...(startingAfter && { starting_after: startingAfter })
        };

        const invoices = await this.stripe.invoices.list(listParams);
        allInvoices = [...allInvoices, ...invoices.data];
        fetchedCount += invoices.data.length;

        hasMore = invoices.has_more && invoices.data.length > 0 && fetchedCount < limit;
        if (hasMore && invoices.data.length > 0) {
          startingAfter = invoices.data[invoices.data.length - 1].id;
        }
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

    try {
      logger.info('Fetching payouts from Stripe...');
      
      while (hasMore && fetchedCount < limit) {
        const fetchLimit = Math.min(100, limit - fetchedCount);
        const listParams: Stripe.PayoutListParams = {
          limit: fetchLimit,
          ...(startingAfter && { starting_after: startingAfter })
        };
        
        logger.debug('Making request to Stripe API for payouts', { 
          fetchLimit,
          startingAfter: startingAfter ? '...' + startingAfter.slice(-8) : 'none',
          fetchedSoFar: fetchedCount
        });

        const payouts = await this.stripe.payouts.list(listParams);
        allPayouts = [...allPayouts, ...payouts.data];
        fetchedCount += payouts.data.length;

        hasMore = payouts.has_more && payouts.data.length > 0 && fetchedCount < limit;
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
