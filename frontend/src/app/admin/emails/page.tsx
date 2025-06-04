'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EmailSubscriber {
  email: string;
  name?: string;
  source?: string;
  timestamp?: string;
}

export default function EmailsAdminPage() {
  const [localEmail, setLocalEmail] = useState<string | null>(null);
  
  // Get email from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalEmail(localStorage.getItem('user_email'));
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Email Subscribers</h1>
        <Link href="/" className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
          Back to Home
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Email Subscribers Information</h2>
        
        <div className="prose">
          <p>
            The email subscribers are stored in two locations:
          </p>
          
          <ol className="list-decimal pl-5 space-y-2 my-4">
            <li>
              <strong>Backend Database:</strong> Emails are saved to <code>/backend/data/email_subscribers.json</code>
            </li>
            <li>
              <strong>Browser Local Storage:</strong> As a fallback, emails are also saved in your browser's local storage
            </li>
          </ol>
          
          <p className="mt-4">
            To view the backend database file directly, you can check the file at:
            <br />
            <code className="bg-gray-100 px-2 py-1 rounded">/Users/ananya/Documents/asteris-automation/backend/data/email_subscribers.json</code>
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Local Storage Email</h2>
        
        {localEmail ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <p>Current user email: <strong>{localEmail}</strong></p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            <p>No email found in local storage</p>
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Add Test Email</h3>
          <div className="flex items-center">
            <input 
              type="email" 
              placeholder="Enter test email"
              className="border rounded px-3 py-2 mr-2 flex-grow"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  localStorage.setItem('user_email', input.value);
                  setLocalEmail(input.value);
                  input.value = '';
                }
              }}
            />
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => {
                const input = document.querySelector('input[type="email"]') as HTMLInputElement;
                if (input && input.value) {
                  localStorage.setItem('user_email', input.value);
                  setLocalEmail(input.value);
                  input.value = '';
                }
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
