'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import IntentSearch from '@/components/IntentSearch';
import Footer from '@/components/Footer';
import styles from './page.module.css';
import { getStripeApiKey } from '@/utils/stripe';
// Using react-icons instead of lucide-react to avoid dependency issues
import { FiHome, FiSettings, FiDatabase, FiBarChart2, FiUsers, FiFileText, FiMenu, FiX } from 'react-icons/fi';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Commented out automatic redirection to allow viewing the home page
  // useEffect(() => {
  //   // Check if Stripe API key is configured
  //   const stripeKey = getStripeApiKey();
  //   if (stripeKey) {
  //     // If configured, go to dashboard
  //     router.push('/dashboard');
  //   }
  // }, [router]);

  const handleSearch = (query: string) => {
    // First go to settings page to configure integrations
    router.push('/settings');
  };
  
  const handleKeywordClick = (keyword: string) => {
    // Remove the quotes from the keyword
    const cleanKeyword = keyword.replace(/"/g, '');
    setSearchQuery(cleanKeyword);
    
    // Focus the search input if we have a ref to it
    if (searchInputRef.current && searchInputRef.current.focusInput) {
      setTimeout(() => {
        searchInputRef.current.focusInput();
      }, 10);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={styles.container}>
      {/* Mobile menu toggle button */}
      <button 
        className={styles.menuToggle} 
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Side Panel - Icons Only */}
      <div className={`${styles.sidePanel} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidePanelHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>A</span>
            <span className={styles.logoText}>Asteris</span>
          </div>
        </div>
        <nav className={styles.sidePanelNav}>
          <ul>
            <li className={styles.active}>
              <a href="/" title="Home">
                <FiHome size={22} />
                <span className={styles.tooltipText}>Home</span>
              </a>
            </li>
            <li className={styles.disabled}>
              <a href="#" title="Dashboard (Coming Soon)" onClick={(e) => e.preventDefault()}>
                <FiBarChart2 size={22} />
                <span className={styles.tooltipText}>Dashboard (Coming Soon)</span>
              </a>
            </li>
            <li className={styles.disabled}>
              <a href="#" title="Integrations (Coming Soon)" onClick={(e) => e.preventDefault()}>
                <FiDatabase size={22} />
                <span className={styles.tooltipText}>Integrations (Coming Soon)</span>
              </a>
            </li>
            <li className={styles.disabled}>
              <a href="#" title="Team (Coming Soon)" onClick={(e) => e.preventDefault()}>
                <FiUsers size={22} />
                <span className={styles.tooltipText}>Team (Coming Soon)</span>
              </a>
            </li>
            <li className={styles.disabled}>
              <a href="#" title="Documentation (Coming Soon)" onClick={(e) => e.preventDefault()}>
                <FiFileText size={22} />
                <span className={styles.tooltipText}>Documentation (Coming Soon)</span>
              </a>
            </li>
            <li>
              <a href="/settings" title="Settings">
                <FiSettings size={22} />
                <span className={styles.tooltipText}>Settings</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className={styles.sidePanelFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar} title="Admin User"></div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`${styles.mainContent} ${sidebarOpen ? styles.shifted : ''}`}>
        <main className={styles.main}>
          <div className={styles.searchContainer}>
            <h1 className={styles.title}>Automate.</h1>
            <div className={styles.suggestedKeywords}>
              <span>Try:</span>
              <span className={styles.keyword} onClick={() => handleKeywordClick('"stripe reconciliation"')}>"stripe reconciliation"</span>
              <span className={styles.keyword} onClick={() => handleKeywordClick('"configure api"')}>"configure api"</span>
              <span className={styles.keyword} onClick={() => handleKeywordClick('"export data"')}>"export data"</span>
            </div>
            <IntentSearch 
              onSearch={handleSearch} 
              initialQuery={searchQuery}
              ref={searchInputRef}
            />
          </div>
        </main>
        <Footer />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className={styles.overlay} onClick={toggleSidebar}></div>}
    </div>
  );
}
