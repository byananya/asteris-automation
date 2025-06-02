'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AutomationCard from '@/components/dashboard/AutomationCard';
import styles from './dashboard.module.css';
// Using react-icons instead of lucide-react to avoid dependency issues
import { FiFileText, FiArrowUpRight, FiAlertTriangle, FiMonitor, FiSettings } from 'react-icons/fi';

export default function Dashboard() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Asteris</div>
        <div className={styles.headerRight}>
          <div className={styles.timeDisplay}>{currentTime}</div>
          <button className={styles.settingsButton} onClick={() => router.push('/settings')}>
            <FiSettings size={18} />
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <h1 className={styles.dashboardTitle}>Automations</h1>
        
        <div className={styles.grid}>
          <div className={styles.row}>
            <h2 className={styles.rowTitle}>Financial Reconciliation</h2>
            <div className={styles.rowCards}>
              <AutomationCard
                icon={<FiFileText />}
                title="Invoice Reconciliation"
                description="Match invoices to payouts and fees"
                actionLabel="Automate"
                onClick={() => router.push('/automation/invoice-reconciliation')}
              />
              
              <AutomationCard
                icon={<FiArrowUpRight />}
                title="Stripe Payout Sync"
                description="Sync and export all Stripe payouts"
                actionLabel="Automate"
                onClick={() => router.push('/payouts')}
              />
            </div>
          </div>
          
          <div className={styles.row}>
            <h2 className={styles.rowTitle}>Monitoring & Extraction</h2>
            <div className={styles.rowCards}>
              <AutomationCard
                icon={<FiAlertTriangle />}
                title="Failed Payment Alerts"
                description="Monitor and alert on failed Stripe charges"
                actionLabel="Configure"
                onClick={() => router.push('/alerts')}
              />
              
              <AutomationCard
                icon={<FiMonitor />}
                title="Vendor Portal Extraction"
                description="Log in to vendor sites and extract invoices"
                actionLabel="Automate"
                onClick={() => router.push('/vendors')}
              />
            </div>
          </div>
        </div>
      </main>
      <div className={styles.backgroundElements}>
        <div className={styles.glowCircle1}></div>
        <div className={styles.glowCircle2}></div>
      </div>
    </div>
  );
}