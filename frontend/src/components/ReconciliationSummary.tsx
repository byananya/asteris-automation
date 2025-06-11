import React from 'react';
import { FiDollarSign, FiCheckCircle, FiAlertTriangle, FiClock, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import styles from './ReconciliationSummary.module.css';

interface Summary {
  totalInvoices: number;
  matchedInvoices: number;
  unmatchedInvoices: number;
  totalAmount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  processingTime: string;
  matchRate: number;
}

interface ReconciliationSummaryProps {
  summary: Summary;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

export const ReconciliationSummary: React.FC<ReconciliationSummaryProps> = ({ summary }) => {
  const stats = [
    {
      title: 'Total Invoices',
      value: summary.totalInvoices.toLocaleString(),
      icon: <FiDollarSign className={styles.icon} />,
      trend: null,
      change: null,
      className: styles.cardPrimary
    },
    {
      title: 'Matched',
      value: summary.matchedInvoices.toLocaleString(),
      percentage: formatPercentage(summary.matchRate),
      icon: <FiCheckCircle className={`${styles.icon} ${styles.successIcon}`} />,
      trend: 'up' as const,
      change: '+5%', // This would come from comparison with previous period
      className: styles.cardSuccess
    },
    {
      title: 'Unmatched',
      value: summary.unmatchedInvoices.toLocaleString(),
      percentage: formatPercentage(1 - summary.matchRate),
      icon: <FiAlertTriangle className={`${styles.icon} ${styles.warningIcon}`} />,
      trend: 'down' as const,
      change: '-2%', // This would come from comparison with previous period
      className: styles.cardWarning
    },
    {
      title: 'Total Amount',
      value: formatCurrency(summary.totalAmount),
      icon: <FiDollarSign className={styles.icon} />,
      trend: 'up' as const,
      change: '+12%', // This would come from comparison with previous period
      className: styles.cardInfo
    },
    {
      title: 'Processing Time',
      value: summary.processingTime,
      icon: <FiClock className={styles.icon} />,
      trend: null,
      change: null,
      className: styles.cardSecondary
    }
  ];

  return (
    <div className={styles.summaryGrid}>
      {stats.map((stat, index) => (
        <div key={index} className={`${styles.summaryCard} ${stat.className}`}>
          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <div className={styles.iconContainer}>
                {stat.icon}
              </div>
              <h3 className={styles.cardTitle}>{stat.title}</h3>
            </div>
            <div className={styles.cardValue}>{stat.value}</div>
            {stat.percentage && (
              <div className={styles.cardPercentage}>
                {stat.percentage} match rate
              </div>
            )}
            {stat.trend && stat.change && (
              <div className={`${styles.trend} ${styles[`trend${stat.trend}`]}`}>
                {stat.trend === 'up' ? <FiTrendingUp /> : <FiTrendingDown />}
                <span>{stat.change}</span>
              </div>
            )}
          </div>
          <div className={styles.cardFooter}>
            <span>View details</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReconciliationSummary;
