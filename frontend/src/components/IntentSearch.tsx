import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import styles from './IntentSearch.module.css';
// Using react-icons instead of lucide-react to avoid dependency issues
import { FiSearch, FiArrowRight, FiSettings, FiZap, FiCommand, FiMic, FiClock, FiX } from 'react-icons/fi';

// Define SpeechRecognition types for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

// Augment the Window interface
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface IntentSearchProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const IntentSearch = forwardRef<any, IntentSearchProps>(({ onSearch, initialQuery = '' }, ref) => {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [justSelected, setJustSelected] = useState(false);
  const [selectionComplete, setSelectionComplete] = useState(false);
  
  // Update query when initialQuery changes
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);
  
  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setSearchHistory(parsedHistory.slice(0, 5)); // Limit to 5 most recent searches
        }
      } catch (e) {
        console.error('Error parsing search history:', e);
      }
    }
  }, []);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focusInput: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    setQuery: (value: string) => {
      setQuery(value);
    }
  }));

  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const commonQueries = [
    'Setup Stripe Integration',
    'Configure Stripe',
    'Manage Integrations',
    'Setup Automation',
    'Create Workflow',
    'Configure API Settings',
    'Set up Integrations',
    'Manage Authentication'
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add to search history if not already present
    if (!searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory].slice(0, 5); // Keep only last 5 searches
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }

    // Clear all suggestions and results
    setSuggestions([]);
    setAutocompleteResults([]);
    setShowResults(false);
    setShowHistory(false);
    
    setIsLoading(true);
    
    // Navigate to settings page (or wherever the search should go)
    router.push('/settings');
  };

  // Create a ref to store the timeout ID for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // If the user has selected an item and not cleared it manually, don't show suggestions
    if (selectionComplete) {
      return;
    }

    // If this change was triggered by selecting an item, don't show suggestions
    if (justSelected) {
      setJustSelected(false);
      // Clear all suggestions and results to prevent them from showing
      setSuggestions([]);
      setAutocompleteResults([]);
      setShowResults(false);
      return;
    }

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (value.trim()) {
      if (value.length < 2) {
        // For very short queries, show basic filtered suggestions
        const filtered = commonQueries.filter(q =>
          q.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
        setAutocompleteResults([]);
      } else {
        // For longer queries, prioritize semantic search
        // Clear regular suggestions initially
        setSuggestions([]);
        
        // Debounce the API call to avoid too many requests
        debounceTimeoutRef.current = setTimeout(() => {
          generateAutocomplete(value);
        }, 300); // Wait 300ms before making API call
      }

      setShowResults(true);
      setShowHistory(false);
    } else {
      setSuggestions([]);
      setAutocompleteResults([]);
      setShowResults(false);
    }
  };

  const generateAutocomplete = async (value: string) => {
    // Don't fetch suggestions if selection is complete
    if (selectionComplete) {
      return;
    }
    
    // Only fetch suggestions if query is at least 2 characters
    if (value.length < 2) {
      setAutocompleteResults([]);
      return;
    }
    
    try {
      // Call the semantic search API for suggestions
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002');
      const response = await fetch(`${apiBaseUrl}/api/semantic-search/suggestions?query=${encodeURIComponent(value)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        // Only update if selection is not complete
        if (!selectionComplete) {
          setAutocompleteResults(data.suggestions);
          // Clear regular suggestions when showing semantic results
          setSuggestions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching semantic suggestions:', error);
      
      // Only update if selection is not complete
      if (!selectionComplete) {
        // Fallback to basic suggestions if API fails
        const fallbackSuggestions = [
          `${value} automation`,
          `${value} integration`,
          `${value} settings`,
          `configure ${value}`,
          `manage ${value} data`
        ];
        
        setAutocompleteResults(fallbackSuggestions.slice(0, 3));
        // Clear regular suggestions when showing fallback results
        setSuggestions([]);
      }
    }
  };

  const handleFocus = () => {
    // Don't show suggestions if selection is complete
    if (selectionComplete) {
      return;
    }
    
    // Don't show suggestions if we just selected an item
    if (justSelected) {
      return;
    }
    
    if (query.trim() && !selectionComplete) {
      const filtered = commonQueries.filter(q =>
        q.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowResults(true);
    } else if (searchHistory.length > 0 && !query.trim()) {
      setShowHistory(true);
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }
    
    setIsListening(true);
    
    // Now TypeScript knows about these properties
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI!();

    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      generateAutocomplete(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    setAutocompleteResults([]);
    setShowResults(false);
    setShowHistory(false);
    setSelectionComplete(false); // Reset selection state when clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const selectHistoryItem = (item: string) => {
    // Set the flag to prevent onChange from triggering suggestions
    setJustSelected(true);
    
    // Mark selection as complete to prevent suggestions
    setSelectionComplete(true);
    
    // Update query
    setQuery(item);
    
    // Clear all suggestions and results
    setShowHistory(false);
    setSuggestions([]);
    setAutocompleteResults([]);
    setShowResults(false);
    
    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const selectAutocompleteItem = (item: string) => {
    // Set the flag to prevent onChange from triggering suggestions
    setJustSelected(true);
    
    // Mark selection as complete to prevent suggestions
    setSelectionComplete(true);
    
    // Update query
    setQuery(item);
    
    // Clear all suggestions and results
    setAutocompleteResults([]);
    setSuggestions([]);
    setShowResults(false);
    
    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      {/* Fixed search form that always stays at the top */}
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.searchControls}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.input}
              placeholder="What would you like to automate?"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              ref={inputRef}
            />
            {query && (
              <button
                type="button" 
                className={styles.clearButton}
                onClick={clearQuery}
                aria-label="Clear search"
              >
                <FiX size={16} />
              </button>
            )}
            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? (
                <div className={styles.loadingSpinner}></div>
              ) : (
                <>
                  <div className={styles.goText}>Go</div>
                  <FiArrowRight size={24} strokeWidth={2.5} className={styles.goArrow} />
                </>
              )}
            </button>
            <div className={styles.divider}></div>
            <button 
              type="button" 
              className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
              onClick={startVoiceRecognition}
              aria-label="Voice search"
            >
              <FiMic size={22} />
            </button>
          </div>
        </div>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingPopup}>
              <div className={styles.loadingSpinner}></div>
              <p>Initializing...</p>
            </div>
          </div>
        )}
      </form>

      {/* Only render one type of results container based on priority */}
      {!selectionComplete && (
        <>
          {/* Priority 1: Show autocomplete results if available */}
          {showResults && autocompleteResults.length > 0 && (
            <div className={styles.suggestions}>
              <div className={styles.suggestionsHeader}>Suggested Actions</div>
              {autocompleteResults.map((item, index) => {
                let icon = <FiCommand size={16} />;
                if (item.toLowerCase().includes('stripe')) {
                  icon = <FiZap size={16} />;
                } else if (item.toLowerCase().includes('settings') || item.toLowerCase().includes('config')) {
                  icon = <FiSettings size={16} />;
                }
                
                return (
                  <div
                    key={index}
                    className={styles.suggestion}
                    onClick={() => selectAutocompleteItem(item)}
                  >
                    <div className={styles.suggestionIcon}>{icon}</div>
                    <div className={styles.suggestionText}>{item}</div>
                    <div className={styles.suggestionArrow}><FiArrowRight size={14} /></div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Priority 2: Show regular suggestions if no autocomplete results */}
          {showResults && autocompleteResults.length === 0 && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              <div className={styles.suggestionsHeader}>Suggested Actions</div>
              {suggestions.map((suggestion, index) => {
                let icon = <FiCommand size={16} />;
                if (suggestion.toLowerCase().includes('stripe')) {
                  icon = <FiZap size={16} />;
                } else if (suggestion.toLowerCase().includes('settings') || suggestion.toLowerCase().includes('config')) {
                  icon = <FiSettings size={16} />;
                }

                return (
                  <div
                    key={index}
                    className={styles.suggestion}
                    onClick={() => {
                      // Set the flag to prevent onChange from triggering suggestions
                      setJustSelected(true);
                      
                      // Mark selection as complete to prevent suggestions
                      setSelectionComplete(true);
                      
                      // Update query
                      setQuery(suggestion);
                      
                      // Clear all suggestions and results
                      setSuggestions([]);
                      setAutocompleteResults([]);
                      setShowResults(false);
                      
                      // Focus the input
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                  >
                    <div className={styles.suggestionIcon}>{icon}</div>
                    <div className={styles.suggestionText}>{suggestion}</div>
                    <div className={styles.suggestionArrow}><FiArrowRight size={14} /></div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Priority 3: Show search history if no other results and not showing results */}
          {!showResults && showHistory && searchHistory.length > 0 && (
            <div className={styles.suggestions}>
              <div className={styles.suggestionsHeader}>Recent Searches</div>
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className={styles.suggestion}
                  onClick={() => selectHistoryItem(item)}
                >
                  <div className={styles.suggestionIcon}><FiClock size={16} /></div>
                  <div className={styles.suggestionText}>{item}</div>
                  <div className={styles.suggestionArrow}><FiArrowRight size={14} /></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default IntentSearch;
