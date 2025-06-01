'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import IntentSearch from '@/components/IntentSearch';
import Footer from '@/components/Footer';
import styles from './page.module.css';
import { getStripeApiKey } from '@/utils/stripe';

export default function Home() {
  const router = useRouter();

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

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Automate.</h1>
        <IntentSearch onSearch={handleSearch} />
      </main>
      <Footer />
    </div>
  );
}
