"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useLogs } from "./LogContext";
import { useToast } from "./ToastContext";
import { usePrestige } from "./PrestigeContext";
import { ALL_BADGES, Badge, DerivedStats } from "../data/achievements";
import confetti from 'canvas-confetti';

// Add this type declaration if you're still having issues
type ConfettiOptions = {
  particleCount?: number;
  spread?: number;
  origin?: {
    x?: number;
    y?: number;
  };
};

type AchievementContextType = {
  unlocked: string[];
  checkForAchievements: () => void;
  allBadges: Badge[];
};

const AchievementContext = createContext<AchievementContextType | undefined>(
  undefined
);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { logs } = useLogs();
  const { showToast } = useToast();
  const { prestige } = usePrestige();
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [toastedBadges, setToastedBadges] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load unlocked badges from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("unlockedBadges");
    const storedToasted = localStorage.getItem("toastedBadges");
    
    if (stored) {
      setUnlocked(JSON.parse(stored));
    }
    
    if (storedToasted) {
      setToastedBadges(JSON.parse(storedToasted));
    } else if (stored) {
      // If no toasted record exists but we have unlocked badges,
      // initialize toastedBadges with all currently unlocked badges
      const loadedBadges = JSON.parse(stored);
      setToastedBadges(loadedBadges);
      localStorage.setItem("toastedBadges", JSON.stringify(loadedBadges));
    }
    
    setInitialized(true);
  }, []);

  // Check for achievements whenever logs change
  useEffect(() => {
    if (initialized) {
      checkForAchievements();
    }
  }, [logs, initialized, prestige]);

  // Save unlocked badges to localStorage whenever they change
  useEffect(() => {
    if (initialized) {
      localStorage.setItem("unlockedBadges", JSON.stringify(unlocked));
    }
  }, [unlocked, initialized]);

  // Save toasted badges to localStorage whenever they change
  useEffect(() => {
    if (initialized) {
      localStorage.setItem("toastedBadges", JSON.stringify(toastedBadges));
    }
  }, [toastedBadges, initialized]);

  const getStats = (): DerivedStats => {
    const totalPushups = logs.reduce((sum, log) => sum + log.count, 0);
    const dayCounts: { [date: string]: number } = {};
    logs.forEach((log) => {
      const date = log.timestamp.split("T")[0];
      dayCounts[date] = (dayCounts[date] || 0) + log.count;
    });

    const daysLogged = Object.keys(dayCounts).length;
    const goalsHit = Object.values(dayCounts).filter((count) => count >= 50).length;

    return {
      totalPushups,
      dayCounts,
      daysLogged,
      goalsHit,
    };
  };

  const checkForAchievements = () => {
    const stats = getStats();
    let newUnlocked = [...unlocked];
    let newToasts: string[] = [];
    
    // Filter badges by prestige level
    const eligibleBadges = ALL_BADGES.filter(
      (badge) => badge.rank <= prestige
    );
    
    // Check each badge
    eligibleBadges.forEach((badge) => {
      if (!unlocked.includes(badge.id) && 
          badge.condition(logs, stats, unlocked, ALL_BADGES)) {
        newUnlocked.push(badge.id);
        
        // Only show toast if we haven't shown it before
        if (!toastedBadges.includes(badge.id)) {
          newToasts.push(badge.id);
        }
      }
    });
    
    // Update unlocked badges if needed
    if (newUnlocked.length > unlocked.length) {
      setUnlocked(newUnlocked);
    }
    
    // Show toasts and update toasted badges
    if (newToasts.length > 0) {
      // Trigger confetti for new achievements
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      newToasts.forEach((badgeId) => {
        const badge = ALL_BADGES.find((b) => b.id === badgeId);
        if (badge) {
          showToast(`🏆 Achievement Unlocked: ${badge.emoji} ${badge.name}`);
        }
      });
      
      setToastedBadges([...toastedBadges, ...newToasts]);
    }
  };

  return (
    <AchievementContext.Provider
      value={{
        unlocked,
        checkForAchievements,
        allBadges: ALL_BADGES,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementContext);
  if (!context)
    throw new Error("useAchievements must be used within an AchievementProvider");
  return context;
}
