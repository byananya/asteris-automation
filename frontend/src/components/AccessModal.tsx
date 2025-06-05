'use client';

import React, { useState, useEffect } from 'react';
import buttonStyles from './Button.module.css';

interface AccessModalProps {
  onAccess: (email: string) => void;
}

const AccessModal: React.FC<AccessModalProps> = ({ onAccess }) => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate email format
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(email));
  }, [email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) return;
    
    setIsSubmitting(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      onAccess(email);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
      <div className="bg-white rounded-lg shadow-xl w-[450px] max-w-[90vw] ml-8">
        <div className="p-10 pl-12 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-bold mb-8 font-playfair" 
              style={{ 
                fontFamily: 'var(--font-playfair)',
                letterSpacing: '0.05em',
                background: 'linear-gradient(to right, #2c3e50, #4a5568)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0px 0px 1px rgba(0,0,0,0.1)'
              }}>
            Access Asteris
          </h1>
          <p className="text-gray-600 text-lg mb-10">Enter your email to unlock your workspace</p>
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center mt-4">
            <div className="w-full mb-16">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 text-center mb-6"
                style={{
                  borderRadius: '0.75rem',
                  padding: '1rem 1.25rem',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease'
                }}
                required
                autoFocus
              />
            </div>
            
            <button 
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`${buttonStyles.modernButton} ${!isValid ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''} font-playfair`}
              style={{ 
                fontFamily: 'var(--font-playfair)', 
                letterSpacing: '0.05em',
                fontSize: '1.1rem',
                fontWeight: 500,
                transform: isValid ? 'translateY(0)' : 'none',
                transition: 'all 0.3s ease',
                padding: '0.75rem 2rem',
                width: 'auto',
                maxWidth: '90%',
                margin: '0 auto',
                display: 'block'
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Continue <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccessModal;
