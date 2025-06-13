import React, { useState } from 'react';
import { getStripeHeaders } from '../../utils/stripe';
import styles from './ReconciliationPanel.module.css';

interface ReconciliationSummary {
  totalGross: number;
  totalFees: number;
  totalNet: number;
  recordCount: number;
}

export default function ReconciliationPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const runReconciliation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First get the summary
      const queryParams = new URLSearchParams({
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const summaryResponse = await fetch(`/api/stripe/reconciliation/summary?${queryParams}`, {
        method: 'GET',
        headers: getStripeHeaders()
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch reconciliation summary');
      }

      const summaryData = await summaryResponse.json();
      setSummary(summaryData);

      // Then download the CSV
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002');
      const csvResponse = await fetch(`${apiBaseUrl}/api/reconcile/invoices`, {
        method: 'POST',
        headers: getStripeHeaders(),
        body: JSON.stringify(dateRange),
      });

      if (!csvResponse.ok) {
        throw new Error('Failed to generate reconciliation report');
      }

      // Create a download link for the CSV
      const blob = await csvResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reconciliation-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Reconciliation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Invoice Reconciliation</h2>
        <p className={styles.description}>
          Generate a detailed reconciliation report of your Stripe invoices,
          including payment details and fees.
        </p>
      </div>

      <div className={styles.dateControls}>
        <div className={styles.dateField}>
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className={styles.input}
          />
        </div>
        <div className={styles.dateField}>
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className={styles.input}
          />
        </div>
      </div>

      <button
        onClick={runReconciliation}
        disabled={isLoading}
        className={styles.reconcileButton}
      >
        {isLoading ? (
          <>
            <div className={styles.spinner} />
            Running Reconciliation...
          </>
        ) : (
          'Run Invoice Reconciliation'
        )}
      </button>

      {error && <div className={styles.error}>{error}</div>}

      {summary && (
        <div className={styles.summary}>
          <h3>Reconciliation Summary</h3>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.label}>Total Gross</span>
              <span className={styles.value}>
                ${(summary.totalGross / 100).toFixed(2)}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Total Fees</span>
              <span className={styles.value}>
                ${(summary.totalFees / 100).toFixed(2)}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Total Net</span>
              <span className={styles.value}>
                ${(summary.totalNet / 100).toFixed(2)}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Records Processed</span>
              <span className={styles.value}>{summary.recordCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
