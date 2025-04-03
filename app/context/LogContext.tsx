// app/context/LogContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Log = {
  count: number;
  timestamp: Date;
};

type LogContextType = {
  logs: Log[];
  addLog: (count: number, timestamp?: Date) => void;
  clearLogs: () => void;
};

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<Log[]>([]);

  // Load logs from localStorage on mount
  useEffect(() => {
    const storedLogs = localStorage.getItem('pushupLogs');
    if (storedLogs) {
      try {
        const parsed = JSON.parse(storedLogs) as { count: number; timestamp: string }[];
        const logsWithDate = parsed.map(log => ({
          count: log.count,
          timestamp: new Date(log.timestamp)
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

  const addLog = (count: number, timestamp?: Date) => {
    const newLog: Log = { count, timestamp: timestamp || new Date() };
    setLogs([...logs, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
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
