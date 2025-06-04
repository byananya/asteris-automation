'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function EmailExportPage() {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Backend URL (should match the one in the API route)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
  
  const handleExport = (format: 'csv' | 'json') => {
    if (!adminKey) {
      setError('Please enter the admin key');
      return;
    }
    
    // Direct the browser to download the file
    const exportUrl = `${backendUrl}/email-export/${format}?adminKey=${encodeURIComponent(adminKey)}`;
    window.open(exportUrl, '_blank');
    
    setSuccess(`Downloading email data in ${format.toUpperCase()} format...`);
    setTimeout(() => setSuccess(''), 3000);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Email Subscriber Export</h1>
          <p className="mt-2 text-gray-600">Export email addresses for Google Sheets</p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-1">
            Admin Key
          </label>
          <input
            type="password"
            id="adminKey"
            value={adminKey}
            onChange={(e) => {
              setAdminKey(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            placeholder="Enter admin key"
          />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}
        
        <div className="flex space-x-4">
          <button
            onClick={() => handleExport('csv')}
            className="flex-1 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Export as JSON
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
