// Utility functions for Stripe integration

export const STRIPE_API_KEY_STORAGE_KEY = 'stripe_api_key';

export const saveStripeApiKey = (apiKey: string) => {
  localStorage.setItem(STRIPE_API_KEY_STORAGE_KEY, apiKey);
};

export const getStripeApiKey = () => {
  return localStorage.getItem(STRIPE_API_KEY_STORAGE_KEY) || '';
};

export const getStripeHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'x-stripe-key': getStripeApiKey(),
  };
};
