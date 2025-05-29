'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';

export default function ConfigurePage() {
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');
  const [loading, setLoading] = useState(false);

  const handleConfigure = async () => {
    setLoading(true);
    // Here you would typically:
    // 1. Validate the configuration
    // 2. Send it to your backend
    // 3. Create the automation
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
    setLoading(false);
  };

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.logo}>✱ Asteris</div>
      </nav>

      <div className={styles.container}>
        <h1 className={styles.title}>Configure Your Automation</h1>
        
        <div className={styles.intentCard}>
          <h2>Your Intent</h2>
          <p className={styles.intent}>{intent}</p>
        </div>

        <div className={styles.configSection}>
          <h2>Schedule</h2>
          <div className={styles.scheduleOptions}>
            <button className={styles.scheduleButton}>Daily</button>
            <button className={styles.scheduleButton}>Weekly</button>
            <button className={styles.scheduleButton}>Monthly</button>
            <button className={styles.scheduleButton}>Custom</button>
          </div>
        </div>

        <div className={styles.configSection}>
          <h2>Connections</h2>
          <div className={styles.connections}>
            {intent?.toLowerCase().includes('aws') && (
              <div className={styles.connection}>
                <img src="/aws-logo.svg" alt="AWS" className={styles.connectionLogo} />
                <button className={styles.connectButton}>Connect AWS</button>
              </div>
            )}
            {intent?.toLowerCase().includes('stripe') && (
              <div className={styles.connection}>
                <img src="/stripe-logo.svg" alt="Stripe" className={styles.connectionLogo} />
                <button className={styles.connectButton}>Connect Stripe</button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.createButton} 
            onClick={handleConfigure}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Automation'}
          </button>
        </div>
      </div>
    </main>
  );
}
