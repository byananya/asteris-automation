import React from 'react';
import styles from './AutomationCard.module.css';

interface AutomationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}

export default function AutomationCard({
  icon,
  title,
  description,
  actionLabel,
  onClick,
}: AutomationCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardInner}>
        <div className={styles.cardContent}>
          <div className={styles.cardHeader}>
            <div className={styles.iconContainer}>{icon}</div>
            <div className={styles.content}>
              <h3 className={styles.title}>{title}</h3>
              <p className={styles.description}>{description}</p>
            </div>
          </div>
          <button className={styles.actionButton} onClick={onClick}>
            <span className={styles.buttonText}>{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
