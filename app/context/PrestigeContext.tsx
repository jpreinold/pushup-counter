// app/context/PrestigeContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLogs } from "./LogContext";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

type PrestigeContextType = {
  prestige: number;
  incrementPrestige: () => void;
};

const PrestigeContext = createContext<PrestigeContextType | undefined>(undefined);

export function PrestigeProvider({ children }: { children: ReactNode }) {
  const [prestige, setPrestige] = useState(1);
  const [loading, setLoading] = useState(true);
  const { logs } = useLogs();
  const { user } = useAuth();

  // Load prestige level from Supabase when user changes
  useEffect(() => {
    const fetchPrestigeLevel = async () => {
      if (!user) {
        setPrestige(1);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_settings')
          .select('prestige_level')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // If no record exists, create one with default values
          if (error.code === 'PGRST116') {
            // Check localStorage for a previous prestige level for migration
            const stored = localStorage.getItem("prestigeLevel");
            const initialPrestige = stored ? parseInt(stored) : 1;
            
            await supabase.from('user_settings').insert({
              user_id: user.id,
              prestige_level: initialPrestige,
              current_goal: 50
            });
            
            setPrestige(initialPrestige);
          } else {
            console.error('Error fetching prestige level:', error);
            // Fall back to localStorage if Supabase fails
            const stored = localStorage.getItem("prestigeLevel");
            if (stored) setPrestige(parseInt(stored));
          }
        } else if (data) {
          setPrestige(data.prestige_level);
        }
      } catch (error) {
        console.error('Error in prestige fetch:', error);
        // Fall back to localStorage
        const stored = localStorage.getItem("prestigeLevel");
        if (stored) setPrestige(parseInt(stored));
      } finally {
        setLoading(false);
      }
    };

    fetchPrestigeLevel();
  }, [user]);

  // Save prestige level to Supabase whenever it changes
  useEffect(() => {
    const savePrestigeLevel = async () => {
      if (!user || loading) return;

      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            prestige_level: prestige
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error saving prestige level:', error);
          // Fallback to localStorage
          localStorage.setItem("prestigeLevel", prestige.toString());
        }
      } catch (error) {
        console.error('Error in prestige save:', error);
        // Fallback to localStorage
        localStorage.setItem("prestigeLevel", prestige.toString());
      }
    };

    savePrestigeLevel();
  }, [prestige, user, loading]);

  const incrementPrestige = async () => {
    if (prestige < 10) {
      const newPrestige = prestige + 1;
      setPrestige(newPrestige);
    }
  };

  // Auto check total pushups to unlock next prestige
  useEffect(() => {
    if (loading || !user) return;
    
    const total = logs.reduce((sum, log) => sum + log.count, 0);
    const thresholds = [0, 1000, 5000, 10000, 20000, 50000, 100000, 200000, 365000];
    
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (total >= thresholds[i] && prestige < i + 1) {
        setPrestige(i + 1);
        break;
      }
    }
  }, [logs, loading, user, prestige]);

  return (
    <PrestigeContext.Provider value={{ prestige, incrementPrestige }}>
      {children}
    </PrestigeContext.Provider>
  );
}

export function usePrestige() {
  const context = useContext(PrestigeContext);
  if (!context) throw new Error("usePrestige must be used within PrestigeProvider");
  return context;
}
