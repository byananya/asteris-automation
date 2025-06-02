'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { FiArrowLeft, FiDownload, FiCheckCircle, FiAlertCircle, FiHelpCircle } from 'react-icons/fi';

export default function InvoiceReconciliationResultsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    status: string;
    timestamp: string;
    summary: {
      totalInvoices: number;
      matchedInvoices: number;
      unmatchedInvoices: number;
      totalAmount: number;
      matchedAmount: number;
      unmatchedAmount: number;
      processingTime: string;
    };
    matches: Array<{
      id: string;
      amount: number;
      status: string;
      confidence: number;
    }>;
    issues: Array<{
      type: string;
      count: number;
      totalAmount: number;
      message: string;
    }>;
  } | null>(null);

  useEffect(() => {
    // Simulate loading and processing - no actual API calls
    // Set initial data immediately to avoid "Failed to fetch" errors
    setResults({
      status: 'processing',
      timestamp: new Date().toISOString(),
      summary: {
        totalInvoices: 0,
        matchedInvoices: 0,
        unmatchedInvoices: 0,
        totalAmount: 0,
        matchedAmount: 0,
        unmatchedAmount: 0,
        processingTime: '0s'
      },
      matches: [],
      issues: []
    });
    
    // Create a counter for the steps
    let currentStep = 0;
    const steps = [
      'Fetching invoice data',
      'Fetching payout data',
      'Matching invoices to payouts',
      'Generating report',
      'Finalizing results'
    ];
    
    // Simulate progress updates with faster completion
    const timer = setInterval(() => {
      if (currentStep < steps.length) {
        // Move to next step
        setProgress((currentStep + 1) * (100 / steps.length));
        currentStep++;
        
        // When we reach the last step, complete after a short delay
        if (currentStep === steps.length) {
          setTimeout(() => {
            setIsLoading(false);
            
            // Simulate final results data
            setResults({
              status: 'completed',
              timestamp: new Date().toISOString(),
              summary: {
                totalInvoices: 127,
                matchedInvoices: 108,
                unmatchedInvoices: 19,
                totalAmount: 28750.42,
                matchedAmount: 23731.40,
                unmatchedAmount: 5019.02,
                processingTime: '2m 34s'
              },
              matches: [
                { id: 'INV-2023-001', amount: 1250.00, status: 'matched', confidence: 0.98 },
                { id: 'INV-2023-002', amount: 750.50, status: 'matched', confidence: 0.95 },
                { id: 'INV-2023-003', amount: 2100.75, status: 'partial', confidence: 0.82 },
                { id: 'INV-2023-004', amount: 1500.00, status: 'unmatched', confidence: 0.45 },
                { id: 'INV-2023-005', amount: 3200.25, status: 'matched', confidence: 0.97 }
              ],
              issues: [
                { type: 'unmatched', count: 16, totalAmount: 3768.27, message: 'No matching payout found' },
                { type: 'warning', count: 3, totalAmount: 1250.75, message: 'Multiple potential matches found' }
              ]
            });
          }, 800);
        }
      }
    }, 700);

    return () => clearInterval(timer);
  }, []);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleViewDetails = (invoiceId: string): void => {
    // In a real app, this would navigate to a detailed view
    console.log(`View details for invoice ${invoiceId}`);
  };

  const handleDownloadReport = (): void => {
    if (!results) return;
    
    // Create CSV content
    const headers = ['Invoice ID', 'Amount', 'Status', 'Confidence', 'Date'];
    
    // Convert matches to CSV rows
    const rows = results.matches.map(invoice => [
      invoice.id,
      invoice.amount.toFixed(2),
      invoice.status,
      (invoice.confidence * 100).toFixed(0) + '%',
      new Date().toLocaleDateString() // In a real app, this would be the invoice date
    ]);
    
    // Add summary row
    rows.push(['', '', '', '', '']);
    rows.push(['Summary', '', '', '', '']);
    rows.push(['Total Invoices', results.summary.totalInvoices.toString(), '', '', '']);
    rows.push(['Matched Invoices', results.summary.matchedInvoices.toString(), '$' + results.summary.matchedAmount.toFixed(2), '', '']);
    rows.push(['Unmatched Invoices', results.summary.unmatchedInvoices.toString(), '$' + results.summary.unmatchedAmount.toFixed(2), '', '']);
    
    // Add issues section
    rows.push(['', '', '', '', '']);
    rows.push(['Issues Detected', '', '', '', '']);
    results.issues.forEach(issue => {
      rows.push([issue.message, issue.count.toString(), '$' + issue.totalAmount.toFixed(2), '', '']);
    });
    
    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoice-reconciliation-${new Date().toISOString().split('T')[0]}.csv`);
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
          <h1 className={styles.subtitle}>Invoice Reconciliation Results</h1>
          <p className={styles.description}>
            {isLoading 
              ? 'Processing your invoice reconciliation request...' 
              : 'Your invoice reconciliation has been completed'}
          </p>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className={styles.progressText}>{Math.round(progress)}%</div>
            </div>
            <div className={styles.loadingSteps}>
              <div className={styles.loadingStep}>
                <div className={`${styles.stepIndicator} ${progress > 20 ? styles.completed : styles.current}`}>
                  {progress > 20 ? <FiCheckCircle size={16} /> : '1'}
                </div>
                <div className={styles.stepText}>Fetching invoice data</div>
              </div>
              <div className={styles.loadingStep}>
                <div className={`${styles.stepIndicator} ${progress > 40 ? styles.completed : (progress > 20 ? styles.current : '')}`}>
                  {progress > 40 ? <FiCheckCircle size={16} /> : '2'}
                </div>
                <div className={styles.stepText}>Fetching payout data</div>
              </div>
              <div className={styles.loadingStep}>
                <div className={`${styles.stepIndicator} ${progress > 60 ? styles.completed : (progress > 40 ? styles.current : '')}`}>
                  {progress > 60 ? <FiCheckCircle size={16} /> : '3'}
                </div>
                <div className={styles.stepText}>Matching invoices to payouts</div>
              </div>
              <div className={styles.loadingStep}>
                <div className={`${styles.stepIndicator} ${progress > 80 ? styles.completed : (progress > 60 ? styles.current : '')}`}>
                  {progress > 80 ? <FiCheckCircle size={16} /> : '4'}
                </div>
                <div className={styles.stepText}>Generating report</div>
              </div>
              <div className={styles.loadingStep}>
                <div className={`${styles.stepIndicator} ${progress >= 100 ? styles.completed : (progress > 80 ? styles.current : '')}`}>
                  {progress >= 100 ? <FiCheckCircle size={16} /> : '5'}
                </div>
                <div className={styles.stepText}>Finalizing results</div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.resultsContainer}>
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                  <FiCheckCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Total Invoices</h3>
                  <div className={styles.summaryValue}>{results?.summary.totalInvoices}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.success}`}>
                  <FiCheckCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Matched</h3>
                  <div className={styles.summaryValue}>{results?.summary.matchedInvoices}</div>
                  <div className={styles.summarySubtext}>${results?.summary.matchedAmount.toLocaleString()}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryIcon} ${styles.warning}`}>
                  <FiAlertCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Unmatched</h3>
                  <div className={styles.summaryValue}>{results?.summary.unmatchedInvoices}</div>
                  <div className={styles.summarySubtext}>${results?.summary.unmatchedAmount.toLocaleString()}</div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                  <FiHelpCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <h3>Processing Time</h3>
                  <div className={styles.summaryValue}>{results?.summary.processingTime}</div>
                </div>
              </div>
            </div>
            
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Invoice Matching Results</h2>
                <button className={styles.downloadButton} onClick={handleDownloadReport}>
                  <FiDownload size={16} />
                  <span>Download Full Report</span>
                </button>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Confidence</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results?.matches.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>${invoice.amount.toLocaleString()}</td>
                        <td>
                          <span className={`${styles.status} ${styles[invoice.status]}`}>
                            {invoice.status === 'matched' ? (
                              <>
                                <FiCheckCircle size={14} />
                                <span>Matched</span>
                              </>
                            ) : (
                              <>
                                <FiAlertCircle size={14} />
                                <span>Unmatched</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td>
                          <div className={styles.confidenceBar}>
                            <div 
                              className={`${styles.confidenceFill} ${
                                invoice.confidence > 0.9 ? styles.high : 
                                invoice.confidence > 0.7 ? styles.medium : 
                                styles.low
                              }`}
                              style={{ width: `${invoice.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className={styles.confidenceValue}>
                            {Math.round(invoice.confidence * 100)}%
                          </span>
                        </td>
                        <td>
                          <button 
                            className={styles.actionButton}
                            onClick={() => handleViewDetails(invoice.id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className={styles.pagination}>
                <span>Showing 1-5 of {results?.summary.totalInvoices} invoices</span>
                <div className={styles.paginationControls}>
                  <button className={styles.paginationButton} disabled>Previous</button>
                  <button className={styles.paginationButton}>Next</button>
                </div>
              </div>
            </div>
            
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Issues Detected</h2>
              <div className={styles.issuesContainer}>
                {results?.issues.map((issue, index) => (
                  <div key={index} className={`${styles.issueCard} ${styles[issue.type]}`}>
                    <div className={styles.issueIcon}>
                      {issue.type === 'unmatched' ? (
                        <FiAlertCircle size={20} />
                      ) : (
                        <FiHelpCircle size={20} />
                      )}
                    </div>
                    <div className={styles.issueContent}>
                      <h3>{issue.message}</h3>
                      <p>
                        {issue.count} invoices affected, 
                        totaling ${issue.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <button className={styles.issueAction}>
                      View Affected
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.actions}>
              <button className={styles.secondaryButton} onClick={handleBackToDashboard}>
                Back to Dashboard
              </button>
              <button className={styles.primaryButton} onClick={handleDownloadReport}>
                <FiDownload size={16} />
                <span>Download Full Report</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
