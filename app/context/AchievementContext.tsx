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
  const { logs } = useLogs();
  const { showToast } = useToast();
  const { prestige } = usePrestige();

  useEffect(() => {
    const stored = localStorage.getItem("unlockedBadges");
    if (stored) setUnlocked(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("unlockedBadges", JSON.stringify(unlocked));
  }, [unlocked]);

  useEffect(() => {
    checkForAchievements();
  }, [logs, prestige]);

  const getStats = (): DerivedStats => {
    const totalPushups = logs.reduce((sum, log) => sum + log.count, 0);
    const dayCounts: { [date: string]: number } = {};
    logs.forEach((log) => {
      const date = log.timestamp.toISOString().split("T")[0];
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

    // ✅ Check ALL badges up to current prestige, plus prestige 10 meta badges
    const eligibleBadges = ALL_BADGES.filter(
      (b) => b.rank <= prestige || b.rank === 10
    );

    const newBadges: string[] = [];

    eligibleBadges.forEach((badge) => {
      if (!unlocked.includes(badge.id)) {
        const earned =
          badge.condition.length === 2
            ? badge.condition(logs, stats)
            : badge.condition(logs, stats, unlocked, ALL_BADGES);
        if (earned) newBadges.push(badge.id);
      }
    });

    if (newBadges.length > 0) {
      setUnlocked((prev) => [...prev, ...newBadges]);

      newBadges.forEach((id) => {
        const badge = ALL_BADGES.find((b) => b.id === id);
        if (badge) showToast(`🏅 Badge Unlocked: ${badge.name}`);
      });

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
