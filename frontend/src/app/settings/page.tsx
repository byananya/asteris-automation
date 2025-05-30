'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Settings() {
  const router = useRouter();
  const [stripeApiKey, setStripeApiKey] = useState('sk_test_...');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the Stripe API key
    // For demo purposes, we'll just navigate to dashboard
    router.push('/dashboard');
  };

  const handleSlackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the Slack webhook URL
    // For demo purposes, we'll just navigate to dashboard
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Asteris</h1>
      
      <div className={styles.content}>
        <h2 className={styles.subtitle}>Platform Settings</h2>
        
        <div className={styles.grid}>
          {/* Stripe Integration */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Stripe Integration</h3>
              <span className={styles.connected}>Connected</span>
            </div>
            <form onSubmit={handleStripeSubmit}>
              <div className={styles.formGroup}>
                <label>API Key</label>
                <input
                  type="password"
                  value={stripeApiKey}
                  onChange={(e) => setStripeApiKey(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.primaryButton}>
                  Save & Go to Dashboard
                </button>
                <a href="#" className={styles.link}>Get API Key →</a>
              </div>
            </form>
          </div>

          {/* Slack Integration */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Slack Integration</h3>
              <span className={styles.connected}>Connected</span>
            </div>
            <form onSubmit={handleSlackSubmit}>
              <div className={styles.formGroup}>
                <label>Webhook URL</label>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.primaryButton}>
                  Save Slack Settings
                </button>
                <a href="#" className={styles.link}>Get Webhook URL →</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
