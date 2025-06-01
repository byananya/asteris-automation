'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { getStripeApiKey } from '@/utils/stripe';

export default function ReconciliationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const runReconciliation = async () => {
    setLoading(true);
    setError('');
    try {
      const stripeKey = getStripeApiKey();
      if (!stripeKey) {
        throw new Error('Stripe API key not found. Please configure it in settings.');
      }

      // Call the reconciliation endpoint
      const response = await fetch('http://localhost:3010/api/stripe/reconciliation/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stripe-key': stripeKey
        },
        body: JSON.stringify({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          endDate: new Date()
        })
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || 'Failed to run reconciliation');
        } catch (e) {
          throw new Error('Failed to run reconciliation: ' + text);
        }
      }

      // The response is already CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reconciliation-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            Reconciliation completed successfully! Your report has been downloaded.
          </div>
        )}

        <div className={styles.card}>
          <h2>Run Reconciliation</h2>
          <p>Match all invoices to payouts and fees, and generate a detailed report.</p>
          <button 
            onClick={runReconciliation} 
            disabled={loading}
            className={styles.runButton}
          >
            {loading ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
