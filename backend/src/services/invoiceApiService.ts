import { apiClient } from './apiClient.js';
import { logger } from '../utils/logger.js';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  payouts?: Payout[];
}

export interface Payout {
  id: string;
  amount: number;
  status: string;
  transactionDate: string;
  invoiceId?: string;
  fee?: number;
}

export class InvoiceApiService {
  private basePath = '/api/v1';

  async getInvoices(params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    customerName?: string;
  } = {}): Promise<Invoice[]> {
    try {
      const queryParams: Record<string, string> = {};
      
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.status) queryParams.status = params.status;
      if (params.customerName) queryParams.customerName = params.customerName;
      
      const url = `${this.basePath}/invoices`;
      
      logger.info(`Fetching invoices from API: ${url}`, { params: queryParams });
      
      // For now, return mock data since we don't have a real API
      return this.getMockInvoices();
    } catch (error) {
      logger.error('Error fetching invoices from API:', error);
      // Return mock data as fallback
      return this.getMockInvoices();
    }
  }

  private getMockInvoices(): Invoice[] {
    // Return mock data for development
    return [
      {
        id: 'INV-001',
        invoiceNumber: 'INV-2023-001',
        customerName: 'Acme Corp',
        amount: 1000.00,
        issueDate: '2023-01-15',
        dueDate: '2023-02-14',
        status: 'paid',
        payouts: [
          {
            id: 'PAY-001',
            amount: 1000.00,
            status: 'completed',
            transactionDate: '2023-02-10',
            fee: 0
          }
        ]
      },
      {
        id: 'INV-002',
        invoiceNumber: 'INV-2023-002',
        customerName: 'Globex Corp',
        amount: 2500.50,
        issueDate: '2023-02-01',
        dueDate: '2023-03-03',
        status: 'paid',
        payouts: [
          {
            id: 'PAY-002',
            amount: 2500.50,
            status: 'completed',
            transactionDate: '2023-02-28',
            fee: 0
          }
        ]
      }
    ];
  }

  async getPayouts(params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    invoiceId?: string;
  } = {}): Promise<Payout[]> {
    try {
      const queryParams: Record<string, string> = {};
      
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.status) queryParams.status = params.status;
      if (params.invoiceId) queryParams.invoiceId = params.invoiceId;
      
      const url = `${this.basePath}/payouts`;
      
      logger.info(`Fetching payouts from API: ${url}`, { params: queryParams });
      
      // For now, return mock data since we don't have a real API
      return this.getMockPayouts();
    } catch (error) {
      logger.error('Error fetching payouts from API:', error);
      // Return mock data as fallback
      return this.getMockPayouts();
    }
  }

  private getMockPayouts(): Payout[] {
    // Return mock data for development
    return [
      {
        id: 'PAY-001',
        amount: 1000.00,
        status: 'completed',
        transactionDate: '2023-02-10',
        invoiceId: 'INV-001',
        fee: 0
      },
      {
        id: 'PAY-002',
        amount: 2500.50,
        status: 'completed',
        transactionDate: '2023-02-28',
        invoiceId: 'INV-002',
        fee: 0
      },
      {
        id: 'PAY-003',
        amount: 1500.75,
        status: 'pending',
        transactionDate: '2023-03-15',
        fee: 0
      }
    ];
  }

  async getUnmatchedPayouts(params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Payout[]> {
    try {
      const queryParams: Record<string, string> = {};
      
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      
      const url = `${this.basePath}/payouts/unmatched`;
      
      logger.info('Fetching unmatched payouts from API', { params: queryParams });
      
      // For now, return mock data since we don't have a real API
      return this.getMockPayouts().filter(payout => !payout.invoiceId);
    } catch (error) {
      logger.error('Error fetching unmatched payouts from API:', error);
      // Return mock data as fallback
      return this.getMockPayouts().filter(payout => !payout.invoiceId);
    }
  }
}

export const invoiceApiService = new InvoiceApiService();
