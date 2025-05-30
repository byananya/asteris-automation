import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './IntentSearch.module.css';

interface SearchResult {
  text: string;
  intent: string;
  description: string;
}

interface IntentSearchProps {
  onSearch: (query: string) => void;
}

export default function IntentSearch({ onSearch }: IntentSearchProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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
    'setup stripe integration',
    'configure stripe',
    'manage integrations',
    'setup automation',
    'create workflow'
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3010/api/intent/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });

      if (!response.ok) {
        throw new Error('Failed to classify intent');
      }

      const data = await response.json();
      
      // Create search results
      const results: SearchResult[] = [];
      
      if (data.intent === 'settings') {
        results.push({
          text: query,
          intent: 'settings',
          description: 'Configure platform settings and integrations'
        });
      } else if (data.intent === 'automation') {
        results.push({
          text: query,
          intent: 'automation',
          description: 'Create and manage automation workflows'
        });
      }

      setSearchResults(results);
      setShowResults(true);
      onSearch(query);
    } catch (error) {
      console.error('Error classifying intent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.intent === 'settings') {
      router.push('/settings');
    } else if (result.intent === 'automation') {
      router.push('/automation');
    }
  };

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);

            const filtered = value
              ? commonQueries.filter(q =>
                  q.toLowerCase().includes(value.toLowerCase())
                )
              : [];

            setSuggestions(filtered);
            setShowResults(false);
          }}
          onFocus={() => setShowResults(false)}
          placeholder="What would you like to automate?"
          className={styles.input}
        />
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {suggestions.length > 0 && !showResults && (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={styles.suggestionItem}
              onClick={() => {
                setQuery(suggestion);
                setSuggestions([]);
              }}
            >
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {showResults && searchResults.length > 0 && (
        <div className={styles.searchResults}>
          {searchResults.map((result, index) => (
            <div
              key={index}
              className={styles.resultItem}
              onClick={() => handleResultClick(result)}
            >
              <h3>{result.text}</h3>
              <p>{result.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
