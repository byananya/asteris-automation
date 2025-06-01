'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import IntentSearch from '@/components/IntentSearch';
import Footer from '@/components/Footer';
import styles from './page.module.css';
import { getStripeApiKey } from '@/utils/stripe';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<any>(null);

  // Commented out automatic redirection to allow viewing the home page
  // useEffect(() => {
  //   // Check if Stripe API key is configured
  //   const stripeKey = getStripeApiKey();
  //   if (stripeKey) {
  //     // If configured, go to dashboard
  //     router.push('/dashboard');
  //   }
  // }, [router]);

  const handleSearch = (query: string) => {
    // First go to settings page to configure integrations
    router.push('/settings');
  };
  
  const handleKeywordClick = (keyword: string) => {
    // Remove the quotes from the keyword
    const cleanKeyword = keyword.replace(/"/g, '');
    setSearchQuery(cleanKeyword);
    
    // Focus the search input if we have a ref to it
    if (searchInputRef.current && searchInputRef.current.focusInput) {
      setTimeout(() => {
        searchInputRef.current.focusInput();
      }, 10);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.searchContainer}>
          <h1 className={styles.title}>Automate.</h1>
          <div className={styles.suggestedKeywords}>
            <span>Try:</span>
            <span className={styles.keyword} onClick={() => handleKeywordClick('"stripe reconciliation"')}>"stripe reconciliation"</span>
            <span className={styles.keyword} onClick={() => handleKeywordClick('"configure api"')}>"configure api"</span>
            <span className={styles.keyword} onClick={() => handleKeywordClick('"export data"')}>"export data"</span>
          </div>
          <IntentSearch 
            onSearch={handleSearch} 
            initialQuery={searchQuery}
            ref={searchInputRef}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
