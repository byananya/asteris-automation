import { config, getApiUrl } from '../config';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions extends RequestInit {
  body?: any;
  headers?: Record<string, string>;
}

export async function api<T = any>(
  endpoint: string,
  method: RequestMethod = 'GET',
  data: any = undefined,
  options: RequestOptions = {}
): Promise<T> {
  const url = getApiUrl(endpoint.startsWith('/') ? endpoint : `/${endpoint}`);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
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

  return response.json();
}

// Helper methods for common HTTP methods
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
