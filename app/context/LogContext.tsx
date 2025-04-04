// app/context/LogContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Log {
  id: string;  // Make sure each log has a unique ID
  count: number;
  timestamp: string;
}

interface LogContextType {
  logs: Log[];
  addLog: (count: number, date: Date, callback?: () => void) => void;
  clearLogs: () => void;
  deleteLog: (id: string) => void;  // Add this function
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<Log[]>(() => {
    if (typeof window !== "undefined") {
      const savedLogs = localStorage.getItem("pushupLogs");
      return savedLogs ? JSON.parse(savedLogs) : [];
    }
    return [];
  });

  // Load logs from localStorage on mount
  useEffect(() => {
    const storedLogs = localStorage.getItem('pushupLogs');
    if (storedLogs) {
      try {
        const parsed = JSON.parse(storedLogs) as { count: number; timestamp: string; id?: string }[];
        const logsWithDate = parsed.map(log => ({
          id: log.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          count: log.count,
          timestamp: log.timestamp
        }));
        setLogs(logsWithDate);
      } catch (error) {
        console.error("Failed to parse stored logs", error);
      }
    }
  }, []);

  // Save logs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pushupLogs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (count: number, date: Date, callback?: () => void) => {
    const newLog: Log = {
      id: Date.now().toString(),
      count,
      timestamp: date.toISOString(),
    };
    
    // Update logs state
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem("pushupLogs", JSON.stringify(updatedLogs));
    
    // Call the callback immediately after updating state
    if (callback) {
      // Use a small timeout to ensure React has processed the state update
      setTimeout(callback, 50);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Add the deleteLog function
  const deleteLog = (id: string) => {
    const updatedLogs = logs.filter(log => log.id !== id);
    setLogs(updatedLogs);
  };

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs, deleteLog }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error("useLogs must be used within a LogProvider");
  }
  return context;
}
