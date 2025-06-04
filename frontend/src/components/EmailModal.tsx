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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateEmail(email)) {
      setIsValid(true);
      setIsSubmitting(true);
      setSubmitError('');
      
      // Store email in local storage immediately as a fallback
      // This ensures the user can proceed even if the API call fails
      localStorage.setItem('user_email', email);
      
      try {
        console.log('Submitting email:', email);
        
        // Try to send directly to backend API first
        const backendUrl = 'http://localhost:3011/api/email-signup';
        console.log(`Attempting to connect directly to backend at: ${backendUrl}`);
        
        // Send email to backend API
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email,
            source: 'modal'
          }),
        });
        
        console.log('Response status:', response.status);
        
        // Try to parse the response as JSON
        let data;
        try {
          data = await response.json();
          console.log('Response data:', data);
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          data = { message: 'Invalid response from server' };
        }
        
        if (response.ok) {
          // API call was successful
          console.log('Email successfully saved to backend');
          setIsFadingOut(true);
          setTimeout(() => {
            onClose();
          }, 500);
        } else {
          // Handle API error but still proceed with local storage
          const errorMessage = data?.message || `Error ${response.status}: Failed to save email to backend`;
          console.error('API error:', errorMessage);
          console.log('Continuing with local storage fallback');
          
          // Still close the modal since we saved to localStorage
          setIsFadingOut(true);
          setTimeout(() => {
            onClose();
          }, 500);
        }
      } catch (error) {
        console.error('Network error submitting email:', error);
        // Still proceed with local storage
        console.log('Continuing with local storage fallback due to network error');
        
        // Still close the modal since we saved to localStorage
        setIsFadingOut(true);
        setTimeout(() => {
          onClose();
        }, 500);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsValid(false);
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
