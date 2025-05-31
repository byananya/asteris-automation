'use client';

import IntentSearch from '@/components/IntentSearch';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    // First go to settings page to configure integrations
    router.push('/settings');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Automate.</h1>
        <IntentSearch onSearch={handleSearch} />
      </main>
      <Footer />
    </div>
  );
}
