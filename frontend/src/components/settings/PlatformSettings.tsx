import React, { useEffect, useState } from 'react';
import { saveStripeApiKey, getStripeApiKey } from '../../utils/stripe';

export default function PlatformSettings() {
  const [stripeApiKey, setStripeApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved API key
    setStripeApiKey(getStripeApiKey());
  }, []);

  const handleSave = () => {
    saveStripeApiKey(stripeApiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000); // Clear saved message after 2 seconds
  };

  return (
    <div className="settings-container">
      <h1>Platform Settings</h1>
      <p>Configure your integrations and platform settings</p>

      <div className="integration-section">
        <div className="integration-header">
          <h2>Stripe Integration</h2>
          <span className="status connected">Connected</span>
        </div>
        <p>Process payments and manage subscriptions</p>

        <div className="form-group">
          <label htmlFor="stripeApiKey">API Key</label>
          <div className="input-group">
            <input
              type="password"
              id="stripeApiKey"
              value={stripeApiKey}
              onChange={(e) => setStripeApiKey(e.target.value)}
              placeholder="Enter your Stripe API key"
            />
            <button onClick={() => navigator.clipboard.writeText(stripeApiKey)}>
              Copy
            </button>
          </div>
        </div>

        <div className="actions">
          <button 
            className="primary"
            onClick={handleSave}
            disabled={!stripeApiKey}
          >
            Save & Continue
          </button>
          {saved && <span className="success-message">Settings saved!</span>}
        </div>
      </div>

      <style jsx>{`
        .settings-container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .integration-section {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 2rem;
        }

        .integration-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .status {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .status.connected {
          background: #0d472d;
          color: #4ade80;
        }

        .form-group {
          margin: 1.5rem 0;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #a1a1aa;
        }

        .input-group {
          display: flex;
          gap: 0.5rem;
        }

        input {
          flex: 1;
          background: #27272a;
          border: 1px solid #3f3f46;
          padding: 0.5rem;
          border-radius: 4px;
          color: white;
        }

        button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: 1px solid #3f3f46;
          background: #27272a;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        button:hover {
          background: #3f3f46;
        }

        button.primary {
          background: #7c3aed;
          border-color: #7c3aed;
        }

        button.primary:hover {
          background: #6d28d9;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .success-message {
          margin-left: 1rem;
          color: #4ade80;
        }
      `}</style>
    </div>
  );
}
