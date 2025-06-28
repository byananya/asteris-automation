'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { FiArrowLeft, FiDownload, FiCheckCircle, FiAlertCircle, FiHelpCircle, FiLoader } from 'react-icons/fi';
import { getStripeApiKey, getStripeHeaders } from '@/utils/stripe';
import { api } from '@/utils/api';

// Define frontend interfaces to match backend's ReconciliationResult
interface ReconciliationRecord {
  invoiceId: string;
  customerId: string;
  customerEmail: string;
  invoiceAmount: number;
  chargeId: string;
  grossAmount: number;
  fee: number;
  netAmount: number;
  date: string;
  currency: string;
}

interface ReconciliationSummary {
  totalGross: number;
  totalFees: number;
  totalNet: number;
  recordCount: number;
}

interface ReconciliationResult {
  records: ReconciliationRecord[];
  summary: ReconciliationSummary;
}

export default function InvoiceReconciliationResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ReconciliationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch reconciliation data
  const fetchReconciliationData = async () => {
    const apiKey = getStripeApiKey();
    if (!apiKey) {
      setError('Stripe API key not found. Please configure it in the settings.');
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);
    setResults(null); // Clear previous results

    try {
      const responseData = await api('/reconcile/invoices', 'POST', {
        // You can add startDate and endDate from UI elements here
        // startDate: '2023-01-01',
        // endDate: '2023-12-31',
      }, {
        headers: {
          ...getStripeHeaders(),
          'Content-Type': 'application/json'
        }
      });
      
      // Process the response data
      if (responseData) {
        // Transform the data to match our frontend interfaces
        if (responseData.records) {
          const transformedData = {
            records: responseData.records.map((record: any) => ({
              invoiceId: record.invoiceId || '',
              customerId: record.customerId || '',
              customerEmail: record.customerEmail || '',
              invoiceAmount: record.invoiceAmount || 0,
              chargeId: record.chargeId || '',
              grossAmount: record.grossAmount || 0,
              fee: record.fee || 0,
              netAmount: record.netAmount || 0,
              date: record.date || new Date().toISOString(),
              currency: record.currency || 'usd',
            })),
            summary: responseData.summary || {
              totalGross: 0,
              totalFees: 0,
              totalNet: 0,
              recordCount: 0,
            },
          };
          setResults(transformedData);
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        throw new Error('No data received from server');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error in fetchReconciliationResults:', {
        error: err,
        errorMessage,
        timestamp: new Date().toISOString(),
        endpoint: '/api/reconcile/invoices'
      });
      setError(errorMessage);
      console.error('Frontend fetch error details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchReconciliationData();
  }, []);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleDownloadReport = (): void => {
    if (!results) return;

    // Create CSV content based on ReconciliationRecord interface
    const headers = [
      'Invoice ID', 'Customer ID', 'Customer Email', 'Invoice Amount',
      'Charge ID', 'Gross Amount', 'Fee', 'Net Amount', 'Date', 'Currency'
    ];

    const rows = results.records.map(record => [
      record.invoiceId,
      record.customerId,
      record.customerEmail,
      record.invoiceAmount.toFixed(2),
      record.chargeId,
      record.grossAmount.toFixed(2),
      record.fee.toFixed(2),
      record.netAmount.toFixed(2),
      record.date,
      record.currency
    ]);

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
            <button 
              onClick={() => router.push('/settings')}
              className={styles.settingsButton}
            >
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
                  <h3>Total Records</h3>
                  <div className={styles.summaryValue}>{results.summary.recordCount}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.success}`}>
                  <FiCheckCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Total Gross Amount</h3>
                  <div className={styles.summaryValue}>${results.summary.totalGross.toFixed(2)}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.warning}`}>
                  <FiAlertCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Total Fees</h3>
                  <div className={styles.summaryValue}>${results.summary.totalFees.toFixed(2)}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.info}`}>
                  <FiHelpCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Total Net Amount</h3>
                  <div className={styles.summaryValue}>${results.summary.totalNet.toFixed(2)}</div>
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
                      <th>Customer Email</th>
                      <th>Invoice Amount</th>
                      <th>Gross Amount</th>
                      <th>Fee</th>
                      <th>Net Amount</th>
                      <th>Date</th>
                      <th>Currency</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.records.length > 0 ? (
                      results.records.map((record, index) => (
                        <tr key={record.invoiceId || index}>
                          <td>{record.invoiceId}</td>
                          <td>{record.customerEmail}</td>
                          <td>${record.invoiceAmount.toFixed(2)}</td>
                          <td>${record.grossAmount.toFixed(2)}</td>
                          <td>${record.fee.toFixed(2)}</td>
                          <td>${record.netAmount.toFixed(2)}</td>
                          <td>{record.date}</td>
                          <td>{record.currency}</td>
                          <td>
                            <button className={styles.viewDetailsButton} onClick={() => console.log('View details for', record.invoiceId)}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className={styles.noData}>No reconciliation records found for the given period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Issues Detected section (can be simplified if needed, based on backend issues) */}
            {results.records.length > 0 && (
              <div className={styles.issuesDetected}>
                <h2>Issues Detected</h2>
                <div className={styles.issueCards}>
                  {results.summary.recordCount === 0 && (
                     <div className={styles.issueCard}>
                       <FiAlertCircle size={20} />
                       <p>No records found. Adjust your date range or check API key.</p>
                     </div>
                  )}
                  {results.summary.totalFees > 0 && (
                     <div className={styles.issueCard}>
                       <FiAlertCircle size={20} />
                       <p>Fees detected: ${results.summary.totalFees.toFixed(2)} in total.</p>
                     </div>
                  )}
                  {/* You can add more specific issue detection based on your data */}
                  {results.records.filter(r => r.invoiceAmount !== r.grossAmount).length > 0 && (
                     <div className={styles.issueCard}>
                       <FiAlertCircle size={20} />
                       <p>{results.records.filter(r => r.invoiceAmount !== r.grossAmount).length} records with invoice amount mismatch with gross amount.</p>
                     </div>
                  )}
                  {results.records.filter(r => r.fee > 0 && r.grossAmount === 0).length > 0 && (
                     <div className={styles.issueCard}>
                       <FiAlertCircle size={20} />
                       <p>{results.records.filter(r => r.fee > 0 && r.grossAmount === 0).length} records with fees but zero gross amount.</p>
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
