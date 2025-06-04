'use client';

import { useState, useEffect } from 'react';
import { saveStripeApiKey, getStripeApiKey } from '../../utils/stripe';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Settings() {
  useEffect(() => {
    // Load saved API key
    setStripeApiKey(getStripeApiKey());
  }, []);
  const router = useRouter();
  const [stripeApiKey, setStripeApiKey] = useState('');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      saveStripeApiKey(stripeApiKey);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save Stripe API key:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSlackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div style={{ marginLeft: '70px' }}>
          <h1 className={styles.title}>Asteris</h1>
        </div>
      </nav>
      
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.subtitle}>Platform Settings</h2>
            <p className={styles.description}>Configure your integrations and platform settings</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.helpButton}>
              <span>?</span> Documentation
            </button>
          </div>
        </header>
        
        <div className={styles.grid}>
          {/* Stripe Integration */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div className={styles.cardIcon}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.971 16.5v-9l7.5 4.5-7.5 4.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Stripe Integration</h3>
                  <p className={styles.cardDescription}>Process payments and manage subscriptions</p>
                </div>
              </div>
              <span className={styles.connected}>
                <span className={styles.dot}></span>
                Connected
              </span>
            </div>
            <form onSubmit={handleStripeSubmit}>
              <div className={styles.formGroup}>
                <label>API Key</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="password"
                    value={stripeApiKey}
                    onChange={(e) => setStripeApiKey(e.target.value)}
                    className={styles.input}
                    placeholder="sk_test_..."
                  />
                  <button type="button" className={styles.copyButton}>Copy</button>
                </div>
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.primaryButton} disabled={saving}>
                  {saving ? (
                    <div className={styles.loadingSpinner}></div>
                  ) : (
                    'Save & Continue'
                  )}
                </button>
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Get API Key →
                </a>
              </div>
            </form>
          </div>

          {/* Slack Integration */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div className={styles.cardIcon}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M19.1 2.9C16.8.6 13.5.6 11.2 2.9L2.9 11.2c-2.3 2.3-2.3 5.6 0 7.9 2.3 2.3 5.6 2.3 7.9 0l8.3-8.3c2.3-2.3 2.3-5.6 0-7.9zM9.3 17.7c-1.6 1.6-4.1 1.6-5.7 0-1.6-1.6-1.6-4.1 0-5.7l8.3-8.3c1.6-1.6 4.1-1.6 5.7 0 1.6 1.6 1.6 4.1 0 5.7l-8.3 8.3z" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Slack Integration</h3>
                  <p className={styles.cardDescription}>Get notifications and updates in Slack</p>
                </div>
              </div>
              <span className={styles.connected}>
                <span className={styles.dot}></span>
                Connected
              </span>
            </div>
            <form onSubmit={handleSlackSubmit}>
              <div className={styles.formGroup}>
                <label>Webhook URL</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    className={styles.input}
                    placeholder="https://hooks.slack.com/..."
                  />
                  <button type="button" className={styles.copyButton}>Copy</button>
                </div>
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.primaryButton} disabled={saving}>
                  {saving ? (
                    <div className={styles.loadingSpinner}></div>
                  ) : (
                    'Save Settings'
                  )}
                </button>
                <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Get Webhook URL →
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
