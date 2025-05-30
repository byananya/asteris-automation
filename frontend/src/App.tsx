import IntentSearch from './components/IntentSearch';
import styles from './App.module.css';

function App() {
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // Additional search handling logic can be added here
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Asteris Automation</h1>
        <p>Your intelligent automation assistant</p>
      </header>
      <main className={styles.main}>
        <IntentSearch onSearch={handleSearch} />
      </main>
    </div>
  );
}

export default App;
