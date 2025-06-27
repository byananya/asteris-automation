// For static export, we need to hardcode the production URL
// as environment variables aren't available at runtime in static exports
const PRODUCTION_URL = 'https://api-production-ef16.up.railway.app';
const LOCAL_URL = 'http://localhost:3002';

// In development, use localhost, in production use the production URL
export const API_BASE_URL = 
  typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? LOCAL_URL 
    : PRODUCTION_URL;

console.log('API_BASE_URL:', API_BASE_URL);

export interface ReconciliationParams {
  startDate?: string;
  endDate?: string;
  matchThreshold?: number;
  includeDisputes?: boolean;
  includeRefunds?: boolean;
  notifyOnCompletion?: boolean;
  notifyEmail?: string;
  saveToDatabase?: boolean;
  generateReport?: boolean;
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
  };
  matches: Array<{
    invoiceId: string;
    payoutId: string;
    invoiceAmount: number;
    payoutAmount: number;
    fee: number;
    status: 'matched' | 'partial' | 'unmatched';
    confidence: number;
  }>;
  issues: Array<{
    type: string;
    count: number;
    totalAmount: number;
    message: string;
  }>;
}

export const reconcileInvoices = async (params: ReconciliationParams): Promise<ReconciliationResult> => {
  const response = await fetch(`${API_BASE_URL}/api/reconcile/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to reconcile invoices');
  }

  return response.json();
};
