'use client';

import { useEffect, useState } from 'react';
import styles from './dashboard.module.css';

interface Payment {
  id: string;
  amount: number;
  description: string;
  date: string;
}

interface Customer {
  email: string;
  date: string;
  status: 'Active' | 'Inactive';
}

export default function Dashboard() {
  const [balance, setBalance] = useState(169.38);
  const [payments, setPayments] = useState<Payment[]>([
    { id: '1', amount: 10, description: 'Test payment 3', date: '4/21/2025' },
    { id: '2', amount: 10, description: 'Test payment 2', date: '4/21/2025' },
    { id: '3', amount: 10, description: 'Test payment 1', date: '4/21/2025' },
  ]);
  const [customers, setCustomers] = useState<Customer[]>([
    { email: 'test2@example.com', date: '4/21/2025', status: 'Active' },
    { email: 'test1@example.com', date: '4/21/2025', status: 'Active' },
    { email: 'test0@example.com', date: '4/21/2025', status: 'Active' },
  ]);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.logo}>Asteris</div>
        <button className={styles.logoutButton}>Logout</button>
      </header>

      <div className={styles.testMode}>
        <span className={styles.testIcon}>⚠️</span>
        <div>
          <div className={styles.testTitle}>Test Mode</div>
          <p>Create test data to see how the dashboard works.</p>
          <button className={styles.createTestButton}>Create Test Data</button>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Current Balance</h2>
          <div className={styles.balance}>USD: ${balance}</div>
        </div>

        <div className={styles.card}>
          <h2>Quick Actions</h2>
          <button className={styles.actionButton}>Sync & Download Invoices</button>
        </div>

        <div className={styles.card}>
          <h2>Recent Payments</h2>
          <div className={styles.list}>
            {payments.map(payment => (
              <div key={payment.id} className={styles.listItem}>
                <div>
                  <div>{payment.description}</div>
                  <div className={styles.date}>{payment.date}</div>
                </div>
                <div className={styles.amount}>${payment.amount}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2>Recent Customers</h2>
          <div className={styles.list}>
            {customers.map(customer => (
              <div key={customer.email} className={styles.listItem}>
                <div>
                  <div>{customer.email}</div>
                  <div className={styles.date}>{customer.date}</div>
                </div>
                <div className={styles.status}>{customer.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2>Export Data</h2>
          <div className={styles.exportForm}>
            <div className={styles.formGroup}>
              <label>Report Type</label>
              <select className={styles.select}>
                <option>Payments Report</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Date Range</label>
              <select className={styles.select}>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className={styles.exportButtons}>
              <button className={styles.downloadButton}>
                <span>↓</span> Download CSV
              </button>
              <button className={styles.slackButton}>
                <span>⚡</span> Send to Slack
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.waitlist}>
        <h2>Ready for More?</h2>
        <p>Join our waitlist to be the first to access enhanced features and capabilities.</p>
        <button className={styles.waitlistButton}>Join the Waitlist →</button>
      </div>
    </div>
  );
}
