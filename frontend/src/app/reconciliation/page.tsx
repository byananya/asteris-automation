'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { getStripeApiKey } from '@/utils/stripe';

export default function ReconciliationPage() {
  const router = useRouter();
  
  // Redirect to the new workflow page
  useEffect(() => {
    router.push('/automation/invoice-reconciliation');
  }, [router]);
  
  const runReconciliation = () => {
    router.push('/automation/invoice-reconciliation');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1>Invoice Reconciliation</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.card}>
          <h2>Redirecting...</h2>
          <p>Taking you to the new invoice reconciliation workflow.</p>
          <button 
            onClick={runReconciliation} 
            className={styles.runButton}
          >
            Go Now
          </button>
        </div>
      </div>
    </div>
  );
}
