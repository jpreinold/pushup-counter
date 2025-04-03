// app/context/ToastContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Toast = {
  id: string;
  message: string;
};

type ToastContextType = {
  toasts: Toast[];
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Prevents hydration mismatch
  }, []);

  const showToast = (message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}

      {/* Render only after client-side hydration is complete */}
      {mounted && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-blue-500 text-white px-4 py-2 rounded shadow animate-fadeIn"
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
