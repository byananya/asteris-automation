'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import AccessModal from '../components/AccessModal';

interface AccessContextType {
  hasAccess: boolean;
  userEmail: string;
  setHasAccess: (value: boolean) => void;
  setUserEmail: (email: string) => void;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user has already accessed the platform
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('asterisUserEmail');
      if (storedEmail) {
        setUserEmail(storedEmail);
        setHasAccess(true);
      }
      setIsLoading(false);
    }
  }, []);
  
  // Handle successful access
  const handleAccess = (email: string) => {
    setUserEmail(email);
    setHasAccess(true);
    localStorage.setItem('asterisUserEmail', email);
  };

  // If still loading, show nothing to prevent flash
  if (isLoading) {
    return null;
  }

  return (
    <AccessContext.Provider value={{ 
      hasAccess, 
      userEmail, 
      setHasAccess, 
      setUserEmail 
    }}>
      {hasAccess ? (
        children
      ) : (
        <>
          <AccessModal onAccess={handleAccess} />
          <div 
            className="opacity-5 pointer-events-none" 
            aria-hidden="true"
            style={{ filter: 'blur(3px)' }}
          >
            {children}
          </div>
        </>
      )}
    </AccessContext.Provider>
  );
};

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};

export default AccessProvider;
