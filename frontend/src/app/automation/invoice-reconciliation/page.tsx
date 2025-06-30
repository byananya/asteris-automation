'use client';

import React, { useState } from 'react';
import { getStripeApiKey } from '@/utils/stripe';
import { useRouter } from 'next/navigation';
import { reconcileInvoices } from '@/utils/api';
import styles from './page.module.css';
import { FiArrowLeft, FiUpload, FiCalendar, FiSettings, FiCheckCircle } from 'react-icons/fi';

export default function InvoiceReconciliationPage() {
  const [directApiResponse, setDirectApiResponse] = useState<any>(null);
  const [directApiError, setDirectApiError] = useState<string | null>(null);
  const [directApiLoading, setDirectApiLoading] = useState(false);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dateRange: 'last30days',
    customStartDate: '',
    customEndDate: '',
    includeDisputes: true,
    includeRefunds: true,
    matchThreshold: 0.9,
    notifyOnCompletion: true,
    notifyEmail: '',
    saveToDatabase: true,
    generateReport: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const type = (e.target as HTMLInputElement).type;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async () => {
    console.log('RUN AUTOMATION BUTTON CLICKED - UNIQUE LOG');
    setIsLoading(true);
    
    try {
      const apiKey = getStripeApiKey();
      if (!apiKey) {
        alert('Stripe API key not found. Please configure it in the settings.');
        setIsLoading(false);
        return;
      }

      // Debug: Show masked API key
      console.log('[DEBUG] Stripe API key (masked):', apiKey ? apiKey.substring(0, 4) + '...' : '(none)');

      // Use centralized API utility
      await reconcileInvoices({
        startDate: formData.customStartDate || undefined,
        endDate: formData.customEndDate || undefined,
        includeDisputes: formData.includeDisputes,
        includeRefunds: formData.includeRefunds,
        matchThreshold: formData.matchThreshold,
        notifyOnCompletion: formData.notifyOnCompletion,
        notifyEmail: formData.notifyEmail || undefined,
        saveToDatabase: formData.saveToDatabase,
      });

      // If we get here, the reconciliation started successfully
      router.push('/automation/invoice-reconciliation/results');
    } catch (error: unknown) {
      console.error('Error starting reconciliation:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Failed to start reconciliation: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        <div className={styles.title}>Asteris</div>
        <button className={styles.backToDashboard} onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <FiArrowLeft size={16} />
            <span>Back</span>
          </button>
          <h1 className={styles.subtitle}>Invoice Reconciliation</h1>
          <p className={styles.description}>Match invoices to payouts and fees automatically</p>
        </div>
        
        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>Data Source</div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>Date Range</div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepLabel}>Settings</div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${currentStep >= 4 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepLabel}>Review</div>
          </div>
        </div>
        
        <div className={styles.formContainer}>
          {currentStep === 1 && (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>
      <FiUpload className={styles.stepIcon} />
      Select Data Source
    </h2>
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h3 className={styles.cardTitle}>Stripe</h3>
          <p className={styles.cardDescription}>Connected</p>
        </div>
        <div className={styles.connected}>
          <FiCheckCircle size={14} />
          <span>Connected</span>
        </div>
      </div>
      <div className={styles.cardContent}>
        <p>Your Stripe account is connected and ready for invoice reconciliation.</p>
      </div>
    </div>
    <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
      <button className={styles.primaryButton} onClick={handleNext}>
        Continue
      </button>
    </div>
  </div>
)}
          
          {currentStep === 2 && (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>
      <FiCalendar className={styles.stepIcon} />
      Select Date Range
    </h2>
    <div className={styles.formGroup}>
      <label className={styles.radioLabel}>
        <input
          type="radio"
          name="dateRange"
          value="last30days"
          checked={formData.dateRange === 'last30days'}
          onChange={handleInputChange}
        />
        <span>Last 30 days</span>
      </label>
      <label className={styles.radioLabel}>
        <input
          type="radio"
          name="dateRange"
          value="last90days"
          checked={formData.dateRange === 'last90days'}
          onChange={handleInputChange}
        />
        <span>Last 90 days</span>
      </label>
      <label className={styles.radioLabel}>
        <input
          type="radio"
          name="dateRange"
          value="custom"
          checked={formData.dateRange === 'custom'}
          onChange={handleInputChange}
        />
        <span>Custom date range</span>
      </label>
      {formData.dateRange === 'custom' && (
        <div className={styles.dateRangeContainer}>
          <div className={styles.inputWrapper}>
            <label>Start Date</label>
            <input
              type="date"
              name="customStartDate"
              className={styles.input}
              value={formData.customStartDate}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.inputWrapper}>
            <label>End Date</label>
            <input
              type="date"
              name="customEndDate"
              className={styles.input}
              value={formData.customEndDate}
              onChange={handleInputChange}
            />
          </div>
        </div>
      )}
    </div>
    <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
      <button className={styles.primaryButton} onClick={handleBack}>
        Back
      </button>
      <button className={styles.primaryButton} onClick={handleNext}>
        Continue
      </button>
    </div>
  </div>
)}
          
          {currentStep === 3 && (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>
      <FiSettings className={styles.stepIcon} />
      Configure Settings
    </h2>
    <div className={styles.formGroup}>
      <h3 className={styles.sectionTitle}>Matching Options</h3>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="includeDisputes"
          checked={formData.includeDisputes}
          onChange={handleInputChange}
        />
        <span>Include disputes in reconciliation</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="includeRefunds"
          checked={formData.includeRefunds}
          onChange={handleInputChange}
        />
        <span>Include refunds in reconciliation</span>
      </label>
      <div className={styles.inputWrapper}>
        <label>Match Threshold (0.0 - 1.0)</label>
        <input
          type="range"
          name="matchThreshold"
          min="0.5"
          max="1"
          step="0.05"
          value={formData.matchThreshold}
          onChange={handleInputChange}
          className={styles.rangeInput}
        />
        <div className={styles.rangeValue}>{formData.matchThreshold}</div>
      </div>
    </div>
    <div className={styles.formGroup}>
      <h3 className={styles.sectionTitle}>Output Options</h3>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="notifyOnCompletion"
          checked={formData.notifyOnCompletion}
          onChange={handleInputChange}
        />
        <span>Notify me when reconciliation is complete</span>
      </label>
      {formData.notifyOnCompletion && (
        <div className={styles.inputWrapper}>
          <label>Email Address</label>
          <input
            type="email"
            name="notifyEmail"
            className={styles.input}
            value={formData.notifyEmail}
            onChange={handleInputChange}
            placeholder="your@email.com"
          />
        </div>
      )}
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="saveToDatabase"
          checked={formData.saveToDatabase}
          onChange={handleInputChange}
        />
        <span>Save results to database</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="generateReport"
          checked={formData.generateReport}
          onChange={handleInputChange}
        />
        <span>Generate downloadable report</span>
      </label>
    </div>
    <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
      <button className={styles.primaryButton} onClick={handleBack}>
        Back
      </button>
      <button className={styles.primaryButton} onClick={handleNext}>
        Continue
      </button>
    </div>
  </div>
)}
          
          {currentStep === 4 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Review and Confirm</h2>
              
              <div className={styles.reviewCard}>
                <h3 className={styles.reviewSection}>Data Source</h3>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Source:</span>
                  <span className={styles.reviewValue}>Stripe</span>
                </div>
                
                <h3 className={styles.reviewSection}>Date Range</h3>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Period:</span>
                  <span className={styles.reviewValue}>
                    {formData.dateRange === 'last30days' && 'Last 30 days'}
                    {formData.dateRange === 'last90days' && 'Last 90 days'}
                    {formData.dateRange === 'custom' && 'Custom date range'}
                  </span>
                </div>
                
                {formData.dateRange === 'custom' && (
                  <>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Start Date:</span>
                      <span className={styles.reviewValue}>{formData.customStartDate}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>End Date:</span>
                      <span className={styles.reviewValue}>{formData.customEndDate}</span>
                    </div>
                  </>
                )}
                
                <h3 className={styles.reviewSection}>Settings</h3>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Include Disputes:</span>
                  <span className={styles.reviewValue}>{formData.includeDisputes ? 'Yes' : 'No'}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Include Refunds:</span>
                  <span className={styles.reviewValue}>{formData.includeRefunds ? 'Yes' : 'No'}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Match Threshold:</span>
                  <span className={styles.reviewValue}>{formData.matchThreshold}</span>
                </div>
                
                <h3 className={styles.reviewSection}>Output Options</h3>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Notify on Completion:</span>
                  <span className={styles.reviewValue}>{formData.notifyOnCompletion ? 'Yes' : 'No'}</span>
                </div>
                {formData.notifyOnCompletion && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Email:</span>
                    <span className={styles.reviewValue}>{formData.notifyEmail || 'Not provided'}</span>
                  </div>
                )}
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Save to Database:</span>
                  <span className={styles.reviewValue}>{formData.saveToDatabase ? 'Yes' : 'No'}</span>
                </div>
    </div>
    <div className={styles.inputWrapper}>
      <label>End Date</label>
      <input
        type="date"
        name="customEndDate"
        className={styles.input}
        value={formData.customEndDate}
        onChange={handleInputChange}
      />
    </div>
  </div>
)}
</div>
</div>

{currentStep === 3 && (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>
      <FiSettings className={styles.stepIcon} />
      Configure Settings
    </h2>
    <div className={styles.formGroup}>
      <h3 className={styles.sectionTitle}>Matching Options</h3>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="includeDisputes"
          checked={formData.includeDisputes}
          onChange={handleInputChange}
        />
        <span>Include disputes in reconciliation</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="includeRefunds"
          checked={formData.includeRefunds}
          onChange={handleInputChange}
        />
        <span>Include refunds in reconciliation</span>
      </label>
      
      <div className={styles.inputWrapper}>
        <label>Match Threshold (0.0 - 1.0)</label>
        <input
          type="range"
          name="matchThreshold"
          min="0.5"
          max="1"
          step="0.05"
          value={formData.matchThreshold}
          onChange={handleInputChange}
          className={styles.rangeInput}
        />
        <div className={styles.rangeValue}>{formData.matchThreshold}</div>
      </div>
    </div>
    
    <div className={styles.formGroup}>
      <h3 className={styles.sectionTitle}>Output Options</h3>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="notifyOnCompletion"
          checked={formData.notifyOnCompletion}
          onChange={handleInputChange}
        />
        <span>Notify me when reconciliation is complete</span>
      </label>
      
      {formData.notifyOnCompletion && (
        <div className={styles.inputWrapper}>
          <label>Email Address</label>
          <input
            type="email"
            name="notifyEmail"
            className={styles.input}
            value={formData.notifyEmail}
            onChange={handleInputChange}
            placeholder="your@email.com"
          />
        </div>
      )}
      
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="saveToDatabase"
          checked={formData.saveToDatabase}
          onChange={handleInputChange}
        />
        <span>Save results to database</span>
      </label>
      
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="generateReport"
          checked={formData.generateReport}
          onChange={handleInputChange}
        />
        <span>Generate downloadable report</span>
      </label>
    </div>
  </div>
)}

{currentStep === 4 && (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>Review and Confirm</h2>
    
    <div className={styles.reviewCard}>
      <h3 className={styles.reviewSection}>Data Source</h3>
      <div className={styles.reviewItem}>
        <span className={styles.reviewLabel}>Source:</span>
        <span className={styles.reviewValue}>Stripe</span>
      </div>
      
      <h3 className={styles.reviewSection}>Date Range</h3>
      <div className={styles.reviewItem}>
        <span className={styles.reviewLabel}>Period:</span>
        <span className={styles.reviewValue}>
          {formData.dateRange === 'last30days' && 'Last 30 days'}
          {formData.dateRange === 'last90days' && 'Last 90 days'}
          {formData.dateRange === 'custom' && 'Custom date range'}
        </span>
      </div>
      
      {formData.dateRange === 'custom' && (
        <>
          <div className={styles.reviewItem}>
            <span className={styles.reviewLabel}>Start Date:</span>
            <span className={styles.reviewValue}>{formData.customStartDate}</span>
          </div>
          <div className={styles.reviewItem}>
            <span className={styles.reviewLabel}>End Date:</span>
            <span className={styles.reviewValue}>{formData.customEndDate}</span>
          </div>
        </>
      )}
      
      <h3 className={styles.reviewSection}>Settings</h3>
      <div className={styles.reviewItem}>
        <span className={styles.reviewLabel}>Include Disputes:</span>
        <span className={styles.reviewValue}>{formData.includeDisputes ? 'Yes' : 'No'}</span>
      </div>
      <div className={styles.reviewItem}>
        <span className={styles.reviewLabel}>Include Refunds:</span>
        <span className={styles.reviewValue}>{formData.includeRefunds ? 'Yes' : 'No'}</span>
      </div>
      <div className={styles.reviewItem}>
        <span className={styles.reviewLabel}>Match Threshold:</span>
        <span className={styles.reviewValue}>{formData.matchThreshold}</span>
      </div>
      
      <h3 className={styles.reviewSection}>Output Options</h3>
      <div className={styles.reviewItem}>
        <span className={styles.reviewLabel}>Notify on Completion:</span>
        <span className={styles.reviewValue}>{formData.notifyOnCompletion ? 'Yes' : 'No'}</span>
      </div>
      {formData.notifyOnCompletion && (
        <div className={styles.reviewItem}>
          <span className={styles.reviewLabel}>Email:</span>
          <span className={styles.reviewValue}>{formData.notifyEmail || 'Not provided'}</span>
        </div>
      )}
      <div className={styles.reviewItem}>
        <span className={styles.reviewLabel}>Save to Database:</span>
        <span className={styles.reviewValue}>{formData.saveToDatabase ? 'Yes' : 'No'}</span>
      </div>
      <div className={styles.reviewItem}>
        <span className={styles.reviewLabel}>Generate Report:</span>
        <span className={styles.reviewValue}>{formData.generateReport ? 'Yes' : 'No'}</span>
      </div>
    </div>
    
    <div className={styles.disclaimer}>
      <p>By clicking "Run Automation", you agree to process the data according to the settings above. This process may take several minutes depending on the volume of data.</p>
    </div>

    {/* Action buttons for review step */}
    {currentStep === 4 && (
      <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        <button 
          className={styles.primaryButton} 
          onClick={handleBack}
          disabled={isLoading || directApiLoading}
        >
          <FiArrowLeft size={16} />
          <span style={{ marginLeft: 8 }}>{'Back'}</span>
        </button>
        <button 
          className={styles.primaryButton} 
          onClick={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className={styles.loadingSpinner}></div>
          ) : (
            <span>Run Automation</span>
          )}
        </button>
        <button
          className={styles.primaryButton}
          style={{ marginLeft: 8 }}
          disabled={directApiLoading}
          onClick={async () => {
            setDirectApiError(null);
            setDirectApiLoading(true);
            setDirectApiResponse(null);
            try {
              const apiKey = getStripeApiKey();
              if (!apiKey) {
                setDirectApiError('Stripe API key not found. Please configure it in the settings.');
                setDirectApiLoading(false);
                return;
              }
              const body = {
                startDate: formData.customStartDate || undefined,
                endDate: formData.customEndDate || undefined,
                includeDisputes: formData.includeDisputes,
                includeRefunds: formData.includeRefunds,
                matchThreshold: formData.matchThreshold,
                notifyOnCompletion: formData.notifyOnCompletion,
                notifyEmail: formData.notifyEmail || undefined,
                saveToDatabase: formData.saveToDatabase,
                generateReport: formData.generateReport,
              };
              console.log('Direct API Call:', {
  url: 'https://api-production-ef16.up.railway.app/api/reconcile/invoices',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-stripe-key': apiKey ? apiKey.substring(0, 4) + '...' : '(none)' },
  body
});
const res = await fetch('https://api-production-ef16.up.railway.app/api/reconcile/invoices', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-stripe-key': apiKey
                },
                body: JSON.stringify(body)
              });
              if (!res.ok) throw new Error(`Status ${res.status}`);
              const data = await res.json();
              setDirectApiResponse(data);
            } catch (err: any) {
              setDirectApiError('Direct API call failed: ' + (err.message || err.toString()));
              setDirectApiResponse(null);
            } finally {
              setDirectApiLoading(false);
            }
          }}
        >
          {directApiLoading ? 'Loading...' : 'Direct API Call'}
        </button>
      </div>
    )}

    {/* Show direct API call result or error only on review step */}
    {currentStep === 4 && directApiResponse && (
      <pre style={{ marginTop: 16, background: '#222', color: '#fff', padding: 12, borderRadius: 6, maxHeight: 300, overflow: 'auto' }}>
        {JSON.stringify(directApiResponse, null, 2)}
      </pre>
    )}
    {currentStep === 4 && directApiError && (
      <div style={{ color: 'red', marginTop: 8 }}>{directApiError}</div>
    )}
  </div>
)}

    </div>
  );
}
