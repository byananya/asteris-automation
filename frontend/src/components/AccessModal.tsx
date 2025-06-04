'use client';

import React, { useState, useEffect } from 'react';

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
      <div className="bg-white rounded-lg shadow-xl w-[450px] max-w-[90vw]">
        <div className="p-8 pl-12 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-bold mb-4 font-playfair" 
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
          <p className="text-gray-600 text-lg mb-6">Enter your email to unlock your workspace</p>
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
            <div className="w-full mb-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-t-md focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 text-center border-b-0"
                required
                autoFocus
              />
            </div>
            
            <button 
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`w-full py-5 px-6 flex items-center justify-center rounded-b-md transition-all ${isValid ? 'bg-gradient-to-r from-gray-900 to-black text-white hover:from-black hover:to-gray-800 shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} font-playfair`}
              style={{ 
                fontFamily: 'var(--font-playfair)', 
                letterSpacing: '0.05em',
                fontSize: '1.2rem',
                fontWeight: 500,
                transform: isValid ? 'translateY(0)' : 'none',
                transition: 'all 0.3s ease'
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
