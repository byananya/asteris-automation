'use client';

import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <a href="#">About</a>
          <a href="#">Company</a>
          <a href="#">Legal</a>
        </nav>
        <div className={styles.copyright} style={{ float: 'right' }}>
          &copy; {new Date().getFullYear()} NexusPay Inc.
        </div>
      </div>
    </footer>
  );
}
