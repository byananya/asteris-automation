'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import EmailModal from '../components/EmailModal';

interface EmailModalContextType {
  hasAccess: boolean;
  userEmail: string | null;
  showModal: () => void;
  hideModal: () => void;
}

const EmailModalContext = createContext<EmailModalContextType>({
  hasAccess: false,
  userEmail: null,
  showModal: () => {},
  hideModal: () => {},
});

export const useEmailModal = () => useContext(EmailModalContext);

export const EmailModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has already provided email
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('user_email');
      if (storedEmail) {
        setUserEmail(storedEmail);
        setHasAccess(true);
      } else {
        // Show modal immediately on load if no email is stored
        setIsModalOpen(true);
      }
      setIsLoading(false);
    }
  }, []);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setHasAccess(true);
    setUserEmail(localStorage.getItem('user_email'));
  };

  const showModal = () => {
    setIsModalOpen(true);
  };
  
  const hideModal = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    // Show a minimal loading state
    return <div className="fixed inset-0 bg-black">{children}</div>;
  }

  return (
    <EmailModalContext.Provider value={{ hasAccess, userEmail, showModal, hideModal }}>
      {isModalOpen && <EmailModal onClose={handleCloseModal} />}
      <div 
        className={!hasAccess ? 'opacity-5 pointer-events-none transition-opacity duration-500' : 'transition-opacity duration-500'}
        aria-hidden={isModalOpen}
      >
        {children}
      </div>
    </EmailModalContext.Provider>
  );
};

export default EmailModalProvider;
