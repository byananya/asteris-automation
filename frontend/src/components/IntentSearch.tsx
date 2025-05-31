import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './IntentSearch.module.css';


interface IntentSearchProps {
  onSearch: (query: string) => void;
}

export default function IntentSearch({ onSearch }: IntentSearchProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    // Show suggestions based on the query
    const suggestedActions = [
      'Configure API Settings',
      'Set up Integrations',
      'Manage Authentication'
    ];
    setSuggestions(suggestedActions);
    setShowResults(true);
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      const filtered = commonQueries.filter(q =>
        q.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowResults(true);
    } else {
      setSuggestions([]);
      setShowResults(false);
    }
  };



  return (
    <div className={styles.searchContainer} ref={searchRef}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim()) {
              const filtered = commonQueries.filter(q =>
                q.toLowerCase().includes(query.toLowerCase())
              );
              setSuggestions(filtered);
              setShowResults(true);
            }
          }}
          placeholder="What would you like to automate?"
          className={styles.input}
        />
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Go'}
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={styles.suggestionItem}
              onClick={() => {
                setQuery(suggestion);
                setSuggestions([]);
                setShowResults(false);
              }}
            >
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
