"use client";

// Analytics utility for tracking user interactions and events
// This file provides a unified interface for all analytics tracking

type EventParams = Record<string, string | number | boolean>;

/**
 * Analytics service for tracking user interactions and page views
 */
class AnalyticsService {
  private isInitialized = false;
  private userId: string | null = null;

  /**
   * Initialize analytics with user information
   * @param userId - Unique identifier for the current user
   */
  init(userId?: string): void {
    if (this.isInitialized) return;
    
    if (userId) {
      this.userId = userId;
      this.identifyUser(userId);
    }
    
    this.isInitialized = true;
    console.log('Analytics service initialized');
  }

  /**
   * Identify a user for personalized analytics
   * @param userId - Unique identifier for the user
   * @param traits - Additional user properties
   */
  identifyUser(userId: string, traits: Record<string, any> = {}): void {
    this.userId = userId;
    
    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('set', 'user_properties', {
        user_id: userId,
        ...traits
      });
    }
  }

  /**
   * Track a page view
   * @param pageName - Name of the page being viewed
   * @param pageProps - Additional page properties
   */
  trackPageView(pageName: string, pageProps: Record<string, any> = {}): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...pageProps
      });
    }
    
    console.log(`Page view: ${pageName}`, pageProps);
  }

  /**
   * Track a custom event
   * @param eventName - Name of the event
   * @param params - Event parameters
   */
  trackEvent(eventName: string, params: EventParams = {}): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        ...params,
        user_id: this.userId
      });
    }
    
    console.log(`Event: ${eventName}`, params);
  }

  /**
   * Track search queries
   * @param query - The search query
   * @param resultsCount - Number of results returned
   */
  trackSearch(query: string, resultsCount: number): void {
    this.trackEvent('search', {
      search_term: query,
      results_count: resultsCount
    });
  }

  /**
   * Track feature usage
   * @param featureName - Name of the feature being used
   * @param actionType - Type of action (e.g., click, submit)
   */
  trackFeatureUsage(featureName: string, actionType: string): void {
    this.trackEvent('feature_usage', {
      feature_name: featureName,
      action_type: actionType
    });
  }

  /**
   * Track errors encountered by users
   * @param errorMessage - Error message
   * @param errorSource - Source of the error
   */
  trackError(errorMessage: string, errorSource: string): void {
    this.trackEvent('error', {
      error_message: errorMessage,
      error_source: errorSource
    });
  }

  /**
   * Track automation workflow execution
   * @param workflowId - ID of the workflow
   * @param status - Execution status (success, failure, etc.)
   * @param duration - Duration of execution in milliseconds
   */
  trackWorkflowExecution(workflowId: string, status: string, duration: number): void {
    this.trackEvent('workflow_execution', {
      workflow_id: workflowId,
      status: status,
      duration: duration
    });
  }
}

// Add window type extension for gtag
declare global {
  interface Window {
    gtag: (command: string, action: string, params?: any) => void;
    dataLayer: any[];
  }
}

// Export a singleton instance
const analytics = new AnalyticsService();
export default analytics;
