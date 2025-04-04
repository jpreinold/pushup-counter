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

const confettiModule = require("canvas-confetti");
const confetti = confettiModule.default || confettiModule;

type AchievementContextType = {
  unlocked: string[];
  checkForAchievements: () => void;
  allBadges: Badge[];
};

const AchievementContext = createContext<AchievementContextType | undefined>(
  undefined
);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [toastedBadges, setToastedBadges] = useState<string[]>([]);
  const { logs } = useLogs();
  const { showToast } = useToast();
  const { prestige } = usePrestige();

  // Load unlocked badges
  useEffect(() => {
    const stored = localStorage.getItem("unlockedBadges");
    if (stored) setUnlocked(JSON.parse(stored));
    
    // Load badges we've already shown toasts for
    const toasted = localStorage.getItem("toastedBadges");
    if (toasted) setToastedBadges(JSON.parse(toasted));
  }, []);

  // Save unlocked badges
  useEffect(() => {
    localStorage.setItem("unlockedBadges", JSON.stringify(unlocked));
  }, [unlocked]);
  
  // Save toasted badges
  useEffect(() => {
    localStorage.setItem("toastedBadges", JSON.stringify(toastedBadges));
  }, [toastedBadges]);

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
