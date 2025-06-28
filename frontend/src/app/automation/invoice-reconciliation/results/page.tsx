'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { FiArrowLeft, FiDownload, FiCheckCircle, FiAlertCircle, FiHelpCircle, FiLoader } from 'react-icons/fi';
import { getStripeApiKey } from '@/utils/stripe';
import { reconcileInvoices } from '@/utils/api';
import type { ReconciliationResult } from '@/utils/api';

export default function InvoiceReconciliationResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ReconciliationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReconciliationData = async () => {
      const apiKey = getStripeApiKey();
      if (!apiKey) {
        setError('Stripe API key not found. Please configure it in the settings.');
        setIsLoading(false);
        return;
      }
      setError(null);
      setIsLoading(true);
      setResults(null);
      try {
        const apiParams = {};
        const responseData = await reconcileInvoices(apiParams);
        if (responseData && responseData.matches) {
          setResults(responseData);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReconciliationData();
  }, []);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleDownloadReport = (): void => {
    if (!results) return;
    const headers = [
      'Invoice ID', 'Payout ID', 'Invoice Amount', 'Payout Amount', 'Fee', 'Status', 'Confidence'
    ];
    const rows = results && Array.isArray(results.matches) ? results.matches.map((match: any) => [
      match.invoiceId,
      match.payoutId,
      match.invoiceAmount?.toFixed(2),
      match.payoutAmount?.toFixed(2),
      match.fee?.toFixed(2),
      match.status,
      match.confidence
    ]) : [];
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stripe-reconciliation-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        <div className={styles.title}>Asteris</div>
        <button className={styles.backToDashboard} onClick={handleBackToDashboard}>
          Back to Dashboard
        </button>
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.push('/automation/invoice-reconciliation')}>
            <FiArrowLeft size={16} />
            <span>Back</span>
          </button>
          <h1 className={styles.subtitle}>Stripe Reconciliation Results</h1>
          <p className={styles.description}>
            Viewing reconciliation results using your saved Stripe API key
          </p>
        </div>
        {error && (
          <div className={styles.errorMessage}>
            <FiAlertCircle size={20} />
            <p>Error: {error}</p>
            <button onClick={() => router.push('/settings')} className={styles.settingsButton}>
              Go to Settings
            </button>
          </div>
        )}
        {isLoading && !error && (
          <div className={styles.loadingContainer}>
            <FiLoader size={48} className={styles.spinner} />
            <p>Fetching and reconciling data from Stripe...</p>
          </div>
        )}
        {!isLoading && !error && results && (
          <div className={styles.resultsContainer}>
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                  <FiCheckCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Total Invoices</h3>
                  <div className={styles.summaryValue}>{results.summary.totalInvoices}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.success}`}>
                  <FiCheckCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Matched Invoices</h3>
                  <div className={styles.summaryValue}>{results.summary.matchedInvoices}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.warning}`}>
                  <FiAlertCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Unmatched Invoices</h3>
                  <div className={styles.summaryValue}>{results.summary.unmatchedInvoices}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.info}`}>
                  <FiHelpCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Total Amount</h3>
                  <div className={styles.summaryValue}>${results.summary.totalAmount.toFixed(2)}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.success}`}>
                  <FiCheckCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Matched Amount</h3>
                  <div className={styles.summaryValue}>${results.summary.matchedAmount.toFixed(2)}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.warning}`}>
                  <FiAlertCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Unmatched Amount</h3>
                  <div className={styles.summaryValue}>${results.summary.unmatchedAmount.toFixed(2)}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.info}`}>
                  <FiHelpCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Processing Time</h3>
                  <div className={styles.summaryValue}>{results.summary.processingTime}</div>
                </div>
              </div>
            </div>
            <div className={styles.tableSection}>
              <h2>
                Reconciliation Records
                <button className={styles.downloadButton} onClick={handleDownloadReport}>
                  <FiDownload size={16} />
                  <span>Download Full Report</span>
                </button>
              </h2>
              <div className={styles.tableWrapper}>
                <table className={styles.resultsTable}>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Payout ID</th>
                      <th>Invoice Amount</th>
                      <th>Payout Amount</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Confidence</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results && results.matches && results.matches.length > 0 && results.matches.map((match, index) => (
                      <tr key={match.invoiceId || index}>
                        <td>{match.invoiceId}</td>
                        <td>{match.payoutId}</td>
                        <td>${match.invoiceAmount?.toFixed(2)}</td>
                        <td>${match.payoutAmount?.toFixed(2)}</td>
                        <td>${match.fee?.toFixed(2)}</td>
                        <td>{match.status}</td>
                        <td>{match.confidence}</td>
                        <td>
                          <button className={styles.viewDetailsButton} onClick={() => console.log('View details for', match.invoiceId)}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!results || !results.matches || results.matches.length === 0) && (
                      <tr>
                        <td colSpan={8} className={styles.noData}>No reconciliation matches found for the given period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}