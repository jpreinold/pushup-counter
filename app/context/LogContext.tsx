// app/context/LogContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface Log {
  id: string;
  count: number;
  timestamp: string;
  user_id: string;
}

interface LogContextType {
  logs: Log[];
  addLog: (count: number, timestamp?: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  deleteDateLogs: (date: Date) => Promise<void>;
  loading: boolean;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

// Custom event for log changes
const emitLogsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('logsChanged'));
  }
};

export function LogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch logs from Supabase when user changes
  useEffect(() => {
    if (user) {
      fetchLogs();
    } else {
      setLogs([]);
      setLoading(false);
    }
  }, [user]);

  const fetchLogs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLog = async (count: number, timestamp?: string) => {
    if (!user) return;
    
    const newLog = {
      count,
      timestamp: timestamp || new Date().toISOString(),
      user_id: user.id,
    };

    try {
      const { data, error } = await supabase
        .from('logs')
        .insert([newLog])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setLogs(prevLogs => {
          const updatedLogs = [data[0], ...prevLogs];
          // Emit event after updating state but within the callback
          setTimeout(() => emitLogsChanged(), 0);
          return updatedLogs;
        });
      }
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  const clearLogs = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setLogs(() => {
        // Emit event after updating state but within the callback
        setTimeout(() => emitLogsChanged(), 0);
        return [];
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const deleteLog = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setLogs(prevLogs => {
        const updatedLogs = prevLogs.filter(log => log.id !== id);
        // Emit event after updating state but within the callback
        setTimeout(() => emitLogsChanged(), 0);
        return updatedLogs;
      });
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const deleteDateLogs = async (date: Date) => {
    if (!user) return;
    
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();
    
    try {
      // Get logs for the specified date
      const { data, error } = await supabase
        .from('logs')
        .select('id, timestamp')
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Filter logs for the specified date
      const logsToDelete = data.filter(log => {
        try {
          const logDate = new Date(log.timestamp);
          return (
            logDate.getFullYear() === targetYear &&
            logDate.getMonth() === targetMonth &&
            logDate.getDate() === targetDay
          );
        } catch (e) {
          console.error("Error filtering log:", e);
          return false;
        }
      });
      
      // Delete logs for the specified date
      if (logsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('logs')
          .delete()
          .in('id', logsToDelete.map(log => log.id));

        if (deleteError) throw deleteError;
        
        // Update local state
        setLogs(prevLogs => {
          const updatedLogs = prevLogs.filter(log => 
            !logsToDelete.some(logToDelete => logToDelete.id === log.id)
          );
          // Emit event after updating state but within the callback
          setTimeout(() => emitLogsChanged(), 0);
          return updatedLogs;
        });
      }
    } catch (error) {
      console.error('Error deleting date logs:', error);
    }
  };

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs, deleteLog, deleteDateLogs, loading }}>
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
