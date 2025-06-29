import { config, getApiUrl } from '../config';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

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

interface RequestOptions extends RequestInit {
  body?: any;
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'text';
}

// Always use getApiUrl from config for correct environment

export async function api<T = any>(
  endpoint: string,
  method: RequestMethod = 'GET',
  data: any = undefined,
  options: RequestOptions = {}
): Promise<T> {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Construct the full URL using getApiUrl from config
  const url = getApiUrl(cleanEndpoint);

  // Debug info: show API URL, env vars, and endpoint
  console.log('[DEBUG] API Request:', {
    url,
    method,
    endpoint,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || 'An error occurred while making the request.'
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  
  // Handle different response types
  const responseType = options.responseType || 'json';
  
  switch (responseType) {
    case 'blob':
      return response.blob() as unknown as T;
    case 'text':
      return response.text() as unknown as T;
    case 'json':
    default:
      return response.json();
  }
}

// Helper methods for common HTTP methods
// Export the main api function and other utilities
export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    api<T>(endpoint, 'GET', undefined, options),
  
  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    api<T>(endpoint, 'POST', data, options),
  
  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    api<T>(endpoint, 'PUT', data, options),
  
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    api<T>(endpoint, 'DELETE', undefined, options),
};

/**
 * Reconcile invoices using the Stripe API
 * @param params Reconciliation parameters
 * @returns Promise with reconciliation results
 */
// Reconcile invoices using the Stripe API
export const reconcileInvoices = (
  params: ReconciliationParams,
  baseUrl?: string
): Promise<ReconciliationResult> => {
  // Always use NEXT_PUBLIC_API_URL or config.apiBaseUrl
  const apiBaseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || config.apiBaseUrl;
  console.log('[DEBUG] Using API Base URL for reconciliation:', apiBaseUrl);
  // Use getApiUrl with custom baseUrl
  const endpoint = '/reconcile/invoices';
  // Patch getApiUrl to accept baseUrl if needed
  const url = `${apiBaseUrl}${apiBaseUrl.endsWith('/') ? '' : '/'}${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
  return api<ReconciliationResult>(url, 'POST', params);
};
