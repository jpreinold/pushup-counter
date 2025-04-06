// app/context/LogContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface Log {
  id: string;
  count: number;
  timestamp: string;
}

interface LogContextType {
  logs: Log[];
  addLog: (count: number, timestamp?: string) => void;
  clearLogs: () => void;
  deleteLog: (id: string) => void;
  deleteDateLogs: (date: Date) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<Log[]>(() => {
    if (typeof window !== "undefined") {
      const savedLogs = localStorage.getItem("pushupLogs");
      if (savedLogs) {
        try {
          return JSON.parse(savedLogs);
        } catch (error) {
          console.error("Failed to parse logs from localStorage", error);
          return [];
        }
      }
    }
    return [];
  });

  // Save logs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pushupLogs", JSON.stringify(logs));
      
      // We'll trigger a custom event that AchievementContext can listen for
      const event = new CustomEvent('logsChanged', { detail: { logs } });
      window.dispatchEvent(event);
    }
  }, [logs]);

  const addLog = (count: number, timestamp?: string) => {
    const newLog = {
      id: Date.now().toString(),
      count,
      timestamp: timestamp || new Date().toISOString(),
    };
    setLogs((prevLogs) => [...prevLogs, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const deleteLog = (id: string) => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
  };

  const deleteDateLogs = (date: Date) => {
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();
    
    setLogs(prevLogs => prevLogs.filter(log => {
      try {
        const logDate = new Date(log.timestamp);
        return !(
          logDate.getFullYear() === targetYear &&
          logDate.getMonth() === targetMonth &&
          logDate.getDate() === targetDay
        );
      } catch (e) {
        console.error("Error filtering log:", e);
        return true; // Keep logs with invalid dates
      }
    }));
  };

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs, deleteLog, deleteDateLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error("useLogs must be used within a LogProvider");
  }
  return context;
}
