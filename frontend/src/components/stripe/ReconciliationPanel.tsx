import React, { useState } from 'react';
import { getStripeHeaders } from '../../utils/stripe';
import { api } from '../../utils/api';
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
  const [responseData, setResponseData] = useState<any>(null);
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

      // Make the reconciliation request using the api utility
      const responseData = await api('/reconcile/invoices', 'POST', {
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined
      }, {
        headers: getStripeHeaders()
      });

      console.log('Received data:', responseData); // Debug log
      
      // Handle the response format from the backend
      if (responseData && responseData.summary) {
        // If the backend provides a summary, use it directly
        setSummary(responseData.summary);
      } else if (responseData && Array.isArray(responseData.records)) {
        // Otherwise calculate summary from records
        const records = responseData.records;
        const summary = {
          totalGross: records.reduce((sum: number, record: any) => sum + (record.amount || 0), 0),
          totalFees: records.reduce((sum: number, record: any) => sum + (record.fee || 0), 0),
          totalNet: records.reduce((sum: number, record: any) => sum + ((record.amount || 0) - (record.fee || 0)), 0),
          recordCount: records.length
        };
        setSummary(summary);
      } else {
        console.error('Unexpected response format:', responseData);
        throw new Error('Unexpected response format from server');
      }
      
      // Save the raw response data for debugging
      setResponseData(responseData);
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

      <div className={styles.actions}>
        <button
          onClick={runReconciliation}
          disabled={isLoading}
          className={styles.button}
        >
          {isLoading ? (
            <>
              <div className={styles.spinner} />
              Processing...
            </>
          ) : (
            'Run Reconciliation'
          )}
        </button>
      </div>

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
