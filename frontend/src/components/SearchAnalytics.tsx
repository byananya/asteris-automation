import React, { useEffect, useRef } from 'react';
import useAnalytics from '../hooks/useAnalytics';

interface SearchAnalyticsProps {
  searchContainerId: string;
  searchInputId: string;
  searchButtonId: string;
  voiceButtonId?: string;
}

/**
 * Component to track search interactions
 * This component doesn't render anything visible but adds analytics tracking to search components
 */
const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({
  searchContainerId,
  searchInputId,
  searchButtonId,
  voiceButtonId,
}) => {
  const { trackSearch, trackFeatureUsage } = useAnalytics();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get DOM elements
    const searchContainer = document.getElementById(searchContainerId);
    const searchInput = document.getElementById(searchInputId) as HTMLInputElement;
    const searchButton = document.getElementById(searchButtonId);
    const voiceButton = voiceButtonId ? document.getElementById(voiceButtonId) : null;

    if (!searchContainer || !searchInput || !searchButton) {
      console.error('Search elements not found for analytics tracking');
      return;
    }

    // Track search input changes
    const handleSearchInput = () => {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set a new timeout to avoid tracking every keystroke
      searchTimeoutRef.current = setTimeout(() => {
        const query = searchInput.value.trim();
        if (query.length > 2) {
          trackFeatureUsage('search_input', 'type');
        }
      }, 1000);
    };

    // Track search submissions
    const handleSearchSubmit = () => {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        // We'll update the results count when results are loaded
        trackSearch(query, 0);
        trackFeatureUsage('search', 'submit');
      }
    };

    // Track voice search usage
    const handleVoiceSearch = () => {
      trackFeatureUsage('voice_search', 'click');
    };

    // Add event listeners
    searchInput.addEventListener('input', handleSearchInput);
    searchButton.addEventListener('click', handleSearchSubmit);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearchSubmit();
      }
    });

    if (voiceButton) {
      voiceButton.addEventListener('click', handleVoiceSearch);
    }

    // Track search results when they appear
    const observeSearchResults = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if the added nodes are search results
          const resultsContainer = searchContainer.querySelector('[data-search-results]');
          if (resultsContainer) {
            const resultCount = resultsContainer.querySelectorAll('[data-search-result]').length;
            const query = searchInput.value.trim();
            if (query.length > 0) {
              trackSearch(query, resultCount);
            }
          }
        }
      });
    });

    // Start observing the search container for result changes
    observeSearchResults.observe(searchContainer, { childList: true, subtree: true });

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchInput.removeEventListener('input', handleSearchInput);
      searchButton.removeEventListener('click', handleSearchSubmit);
      searchInput.removeEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleSearchSubmit();
        }
      });
      if (voiceButton) {
        voiceButton.removeEventListener('click', handleVoiceSearch);
      }
      observeSearchResults.disconnect();
    };
  }, [searchContainerId, searchInputId, searchButtonId, voiceButtonId, trackSearch, trackFeatureUsage]);

  // This component doesn't render anything visible
  return null;
};

export default SearchAnalytics;
