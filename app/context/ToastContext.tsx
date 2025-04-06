// app/context/ToastContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast, Toaster, ToastOptions } from 'react-hot-toast';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const options: ToastOptions = {
      duration: 3000, // 3 seconds duration
      position: 'top-right',
      style: {
        background: type === 'success' ? '#3b82f6' : '#ef4444',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '6px',
      },
      // Custom animations
      className: 'toast-animation',
    };
    
    toast(message, options);
  };
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
