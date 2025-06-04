"use client";

import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import analytics from '../utils/analytics';

/**
 * Custom hook for using analytics throughout the application
 * Automatically tracks page views and provides methods for tracking events
 */
export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views automatically
  useEffect(() => {
    if (!pathname) return;
    
    // Get page name from pathname
    const pageName = pathname.split('/').pop() || 'home';
    
    // Track page view
    analytics.trackPageView(pageName, {
      path: pathname,
      search_params: searchParams ? Object.fromEntries(searchParams.entries()) : {}
    });
  }, [pathname, searchParams]);

  // Helper methods for tracking different types of events
  const trackEvent = useCallback((eventName: string, params = {}) => {
    analytics.trackEvent(eventName, params);
  }, []);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    analytics.trackSearch(query, resultsCount);
  }, []);

  const trackFeatureUsage = useCallback((featureName: string, actionType: string) => {
    analytics.trackFeatureUsage(featureName, actionType);
  }, []);

  const trackError = useCallback((errorMessage: string, errorSource: string) => {
    analytics.trackError(errorMessage, errorSource);
  }, []);

  const trackWorkflowExecution = useCallback((workflowId: string, status: string, duration: number) => {
    analytics.trackWorkflowExecution(workflowId, status, duration);
  }, []);

  return {
    trackEvent,
    trackSearch,
    trackFeatureUsage,
    trackError,
    trackWorkflowExecution
  };
}

export default useAnalytics;
