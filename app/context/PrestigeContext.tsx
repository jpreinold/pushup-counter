// app/context/PrestigeContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLogs } from "./LogContext";

type PrestigeContextType = {
  prestige: number;
  incrementPrestige: () => void;
};

const PrestigeContext = createContext<PrestigeContextType | undefined>(undefined);

export function PrestigeProvider({ children }: { children: ReactNode }) {
  const [prestige, setPrestige] = useState(1);
  const { logs } = useLogs();

  useEffect(() => {
    const stored = localStorage.getItem("prestigeLevel");
    if (stored) setPrestige(parseInt(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("prestigeLevel", prestige.toString());
  }, [prestige]);

  const incrementPrestige = () => {
    if (prestige < 10) setPrestige(prev => prev + 1);
  };

  // Auto check total pushups to unlock next prestige
  useEffect(() => {
    const total = logs.reduce((sum, log) => sum + log.count, 0);
    const thresholds = [0, 1000, 5000, 10000, 20000, 50000, 100000, 200000, 365000];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (total >= thresholds[i] && prestige < i + 1) {
        setPrestige(i + 1);
        break;
      }
    }
  }, [logs]);

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
