'use client';

import React, { useState, useRef, useEffect } from 'react';
import buttonStyles from './Button.module.css';

interface EmailModalProps {
  onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState('');

  // Handle responsive design based on screen width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Determine styling based on device width
  const getModalPadding = () => {
    if (windowWidth <= 390) { // iPhone 14 Pro
      return '1.25rem';
    } else if (windowWidth <= 428) { // iPhone 14 Pro Max and Pixel 7
      return '1.5rem';
    } else {
      return '2rem';
    }
  };
  
  const getFontSize = () => {
    return windowWidth <= 390 ? '0.9rem' : '1rem';
  };

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
      setIsSubmitting(false);
      onClose();
      
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
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-60 animate-fadeIn`}
      style={{ 
        backdropFilter: 'blur(18px)', 
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        ref={modalRef}
        className="relative bg-gray-900 rounded-3xl shadow-lg w-full max-w-md text-center flex flex-col justify-center items-center"
        style={{
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
          width: '92%',
          maxWidth: '420px',
          padding: getModalPadding(),
          backgroundColor: '#1a1a1a',
          marginLeft: '24px',
          overflow: 'hidden'
        }}>
        {/* Ribbon effect */}
        <div 
          className="absolute top-0 left-0 right-0 h-1.5" 
          style={{
            background: 'linear-gradient(90deg, #f9c5d1 0%, #ef90b4 25%, #f9c5d1 50%, #ef90b4 75%, #f9c5d1 100%)',
            backgroundSize: '200% auto',
            animation: 'shimmer 2s linear infinite'
          }} 
        />
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        
        <div className="flex flex-col items-center justify-center w-full px-6 sm:px-10">
          <h1
            className="text-3xl mb-2 font-playfair text-center tracking-tight"
            style={{
              fontSize: windowWidth <= 390 ? '2rem' : '2.5rem',
              lineHeight: 1.2,
              fontFamily: 'var(--font-playfair)',
              background: 'linear-gradient(to right, #f9c5d1, #ef90b4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}
          >
            Access Asteris
          </h1>
          <p 
            className="text-center mb-10 text-neutral-400 leading-snug tracking-wide"
            style={{ 
              fontSize: windowWidth <= 390 ? '1rem' : '1.125rem',
              maxWidth: 440,
              margin: '0 auto',
              fontWeight: 300,
              fontFamily: 'var(--font-playfair)',
              lineHeight: 1.6,
              letterSpacing: '0.005em'
            }}
          >
            Sign in with your email to unlock your workspace.
          </p>
          <br />
          
          <form onSubmit={handleSubmit} className="text-center mt-8 w-full flex flex-col items-center">
            <div className="w-full mb-12">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!isValid) setIsValid(true);
                }}
                placeholder="you@email.com"
                className={`text-base border ${!isValid ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-center max-w-[85%] sm:max-w-[80%] mx-auto block`}
                style={{ 
                  color: '#555',
                  fontSize: getFontSize(),
                  marginBottom: windowWidth <= 390 ? '16px' : '20px',
                  borderRadius: '0.75rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  maxWidth: 420,
                  fontFamily: 'var(--font-playfair)',
                }}
                required
                autoFocus
              />
            </div>
            
            {!isValid && (
              <p className="text-red-500 text-sm -mt-8 mb-8 text-center">Please enter a valid email address</p>
            )}
            
            {submitError && (
              <p className="text-red-500 text-sm -mt-8 mb-8 text-center">{submitError}</p>
            )}
            
            <button 
              type="submit" 
              className={`${buttonStyles.modernButton} ${buttonStyles.flowButton} mb-2 mx-auto block`}
              disabled={isSubmitting}
              style={{ 
                fontSize: '1rem',
                fontWeight: 500,
                padding: '1rem 0',
                width: '100%',
                minWidth: '180px',
                maxWidth: '220px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto',
                flexShrink: 0,
                fontFamily: 'var(--font-playfair)',
              }}
            >
              
              {isSubmitting ? (
                <span className="flex items-center justify-center w-full">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center w-full flowButton">
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