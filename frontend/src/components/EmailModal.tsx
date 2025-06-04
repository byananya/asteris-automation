'use client';

import React, { useState, useRef, useEffect } from 'react';

interface EmailModalProps {
  onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Focus the input field when the modal appears
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setIsValid(false);
      return;
    }
    
    setIsValid(true);
    setIsSubmitting(true);
    setSubmitError('');
    
    // Always save to localStorage first for reliability
    localStorage.setItem('user_email', email);
    
    try {
      // In production with static export, API routes don't work
      // So we'll make a direct call to the backend instead
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3011';
      
      try {
        // Attempt to send to backend API
        const response = await fetch(`${backendUrl}/api/email-signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, source: 'modal' }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.log('Backend response not OK, but continuing with local storage');
        }
      } catch (apiError) {
        // If API call fails, just log it - we'll still close the modal
        // since we've saved to localStorage
        console.log('API call failed, but continuing with local storage:', apiError);
      }
      
      // Always close modal after submission attempt, since we saved to localStorage
      setIsFadingOut(true);
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('Error in email submission process:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit email');
      // Keep modal open on critical errors
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-60 ${isFadingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      style={{ 
        backdropFilter: 'blur(18px)', 
        WebkitBackdropFilter: 'blur(18px)',
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        ref={modalRef}
        className="bg-gray-900 rounded-3xl shadow-lg w-full max-w-md text-center flex flex-col justify-center items-center"
        style={{
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
          minWidth: '420px',
          padding: '3rem',
          backgroundColor: '#1a1a1a'
        }}
      >
        <div className="flex flex-col items-center justify-center w-full">
          <h2 className="text-4xl font-bold mb-8 text-center" style={{ color: '#ffffff' }}>
            Access Asteris
          </h2>
          <p className="text-lg text-gray-300 mb-10 text-center">
            Enter your email to unlock your workspace
          </p>
          
          <form onSubmit={handleSubmit} className="text-center mt-4 w-full flex flex-col items-center space-y-6">
            <div className="w-full mb-0">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!isValid) setIsValid(true);
                }}
                placeholder="you@company.com"
                className={`w-full px-4 py-3 text-base border ${!isValid ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-center`}
                style={{ 
                  color: '#555',
                  fontSize: '16px'
                }}
                required
                autoFocus
              />
            </div>
            
            {!isValid && (
              <p className="text-red-500 text-sm mb-2 text-center">Please enter a valid email address</p>
            )}
            
            {submitError && (
              <p className="text-red-500 text-sm mb-2 text-center">{submitError}</p>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 flex items-center justify-center rounded-lg transition-all bg-black text-white hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ 
                fontSize: '1rem',
                fontWeight: 500
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
                  Continue
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
