import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger.js';

interface ApiConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      baseURL: config.baseURL.endsWith('/') ? config.baseURL : `${config.baseURL}/`,
      timeout: config.timeout || 30000,
      apiKey: config.apiKey
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      // Prevent circular references in error objects
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      transformResponse: [
        (data) => {
          try {
            return JSON.parse(data);
          } catch (e) {
            return data;
          }
        }
      ]
    });

    // Add a request interceptor to handle request errors
    this.client.interceptors.request.use(
      (config) => {
        // Ensure headers are properly set
        config.headers = config.headers || {};
        if (this.config.apiKey) {
          config.headers.Authorization = `Bearer ${this.config.apiKey}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          method: config.method,
          url: config.url,
          params: config.params,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`, {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          logger.error('API Response Error:', {
            status: error.response.status,
            data: error.response.data,
            url: error.config.url,
            method: error.config.method
          });
        } else if (error.request) {
          // The request was made but no response was received
          logger.error('API No Response:', {
            message: error.message,
            url: error.config.url,
            method: error.config.method
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          logger.error('API Request Setup Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.client.get<T>(url, {
        ...config,
        headers: {
          ...config.headers
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data || error.message;
        throw new Error(`API request failed: ${JSON.stringify(errorData, null, 2)}`);
      }
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data || error.message;
        throw new Error(`API request failed: ${JSON.stringify(errorData, null, 2)}`);
      }
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Example usage with environment variables
const apiBaseUrl = process.env.API_BASE_URL || 'https://api.example.com';
const apiKey = process.env.API_KEY;

export const apiClient = new ApiClient({
  baseURL: apiBaseUrl,
  apiKey: apiKey,
  timeout: 30000 // 30 seconds
});
