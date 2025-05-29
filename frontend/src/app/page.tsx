'use client';

import Link from 'next/link'
import SuggestionCard from '@/components/SuggestionCard'
import styles from './page.module.css'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [intent, setIntent] = useState('');
  const [placeholder, setPlaceholder] = useState('Type your task and let the magic happen');
  const router = useRouter();

  const placeholders = [
    'Create a data visualization dashboard',
    'Build an API integration workflow',
    'Setup automated testing pipeline',
    'Deploy microservices architecture',
    'Generate documentation from codebase'
  ];

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setPlaceholder(placeholders[currentIndex]);
      currentIndex = (currentIndex + 1) % placeholders.length;
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intent.trim()) {
      router.push(`/configure?intent=${encodeURIComponent(intent)}`);
    }
  };

  const handleSuggestionClick = (suggestion: { title: string; description: string }) => {
    setIntent(suggestion.title);
    router.push(`/configure?intent=${encodeURIComponent(suggestion.title)}`);
  };
  const suggestions = [
    {
      icon: '💳',
      title: 'Stripe Sync',
      description: 'Weekly payout reports'
    }
  ]

  return (
    <main className={styles.main}>


      <div className={styles.hero}>
        <h1 className={styles.title}>
          Automate anything.
        </h1>
        <p className={styles.subtitle}>
          Declare your intent. Asteris automates it.
        </p>

        <form onSubmit={handleSubmit} className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <input
              type="text"
              placeholder={placeholder}
              className={styles.searchInput}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
            <button type="submit" className={styles.createButton}>
              Create
            </button>
          </div>
        </form>

        <section className={styles.suggestions}>
          <h2>Popular automations</h2>
          <div className={styles.suggestionGrid}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSuggestionClick(suggestion)}
              >
                <SuggestionCard {...suggestion} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/about">About</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </footer>
    </main>
  )
}
