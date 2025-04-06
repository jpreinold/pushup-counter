"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef
} from "react";
import { useLogs } from "./LogContext";
import { useToast } from "./ToastContext";
import { usePrestige } from "./PrestigeContext";
import { ALL_BADGES, Badge, DerivedStats } from "../data/achievements";
import confetti from 'canvas-confetti';
import { useGoal } from './GoalContext';

// Add this type declaration if you're still having issues
type ConfettiOptions = {
  particleCount?: number;
  spread?: number;
  origin?: {
    x?: number;
    y?: number;
  };
};

// We'll maintain this for backward compatibility, but use the Badge system
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  date?: string;
}

// Removed duplicate Badge interface since we're importing it from achievements.ts

interface AchievementContextType {
  achievements: Achievement[];
  unlocked: string[]; // List of unlocked badge IDs for the Stats page
  allBadges: Badge[]; // All badges for the Stats page
  checkForAchievements: () => void;
  validateAchievements: () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(
  undefined
);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { logs } = useLogs();
  const { showToast } = useToast();
  const { prestige } = usePrestige();
  const { goal } = useGoal();
  
  // Add a processing ref to prevent duplicate validations
  const isProcessing = useRef(false);
  
  // Initialize achievements from localStorage or with default empty array
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("achievements");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved achievements", e);
        }
      }
    }
    return [];
  });

  // Calculate unlocked IDs from achievements
  const [unlocked, setUnlocked] = useState<string[]>([]);

  // Save achievements to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("achievements", JSON.stringify(achievements));
      
      // Update unlocked IDs based on earned achievements
      const unlockedIds = achievements
        .filter(achievement => achievement.earned)
        .map(achievement => achievement.id);
      
      setUnlocked(unlockedIds);
    }
  }, [achievements]);

  // Generate derived stats for badge validation
  const getDerivedStats = (): DerivedStats => {
    // Group logs by date
    const dayCounts: { [date: string]: number } = {};
    let totalPushups = 0;
    let goalsHit = 0;
    
    logs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      dayCounts[date] = (dayCounts[date] || 0) + log.count;
      totalPushups += log.count;
    });
    
    // Count days where goal was met
    Object.values(dayCounts).forEach(count => {
      if (count >= goal) {
        goalsHit++;
      }
    });
    
    return {
      totalPushups,
      daysLogged: Object.keys(dayCounts).length,
      goalsHit,
      dayCounts
    };
  };

  // Check for new achievements
  const checkForAchievements = () => {
    // Skip if already processing to prevent duplicates
    if (isProcessing.current) return;
    isProcessing.current = true;
    
    try {
      const stats = getDerivedStats();
      
      // Filter badges by current prestige level
      const availableBadges = ALL_BADGES.filter(
        badge => badge.rank <= prestige
      );
      
      let newAchievementsEarned = false;
      const existingAchievements = [...achievements];
      
      availableBadges.forEach(badge => {
        // Check if badge is already earned
        const existingIndex = existingAchievements.findIndex(
          a => a.id === badge.id
        );
        const existing = existingIndex !== -1;
        
        // If badge is not earned yet, check if it qualifies now
        if (!existing || !existingAchievements[existingIndex].earned) {
          const qualifies = badge.condition(logs, stats, unlocked, ALL_BADGES);
          
          if (!qualifies) return;
          
          const achievement = {
            id: badge.id,
            title: badge.name,
            description: badge.description,
            icon: badge.emoji,
            earned: true,
            date: new Date().toISOString()
          };
          
          if (existing) {
            existingAchievements[existingIndex] = achievement;
          } else {
            existingAchievements.push(achievement);
          }
          
          newAchievementsEarned = true;
          
          // Show notification using original toast system
          showToast(`${badge.emoji} Achievement Unlocked: ${badge.name}`);
          
          // Trigger confetti
          if (typeof window !== 'undefined') {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        }
      });
      
      if (newAchievementsEarned) {
        setAchievements(existingAchievements);
      }
    } finally {
      // Reset processing flag when done
      isProcessing.current = false;
    }
  };
  
  // Validate if earned achievements still qualify
  const validateAchievements = () => {
    // Skip if already processing to prevent duplicates
    if (isProcessing.current) return;
    isProcessing.current = true;
    
    try {
      const stats = getDerivedStats();
      const earnedAchievements = achievements.filter(a => a.earned);
      const achievementsToRevoke: Achievement[] = [];
      
      // Check each earned achievement
      earnedAchievements.forEach(achievement => {
        const badge = ALL_BADGES.find(b => b.id === achievement.id);
        
        if (!badge) return; // Skip if badge definition not found
        
        const stillQualifies = badge.condition(logs, stats, unlocked, ALL_BADGES);
        
        if (!stillQualifies) {
          achievementsToRevoke.push(achievement);
        }
      });
      
      // If any achievements need to be revoked
      if (achievementsToRevoke.length > 0) {
        // Update the achievements array
        const updatedAchievements = achievements.map(achievement => {
          if (achievementsToRevoke.some(a => a.id === achievement.id)) {
            return { 
              ...achievement, 
              earned: false,
              date: undefined 
            };
          }
          return achievement;
        });
        
        setAchievements(updatedAchievements);
        
        // Show notifications for revoked achievements using original toast system
        achievementsToRevoke.forEach(achievement => {
          const badge = ALL_BADGES.find(b => b.id === achievement.id);
          if (badge) {
            // Use the error type for badge removal notifications
            showToast(`❌ Badge Lost: ${badge.name}`, "error");
          }
        });
      }
    } finally {
      // Reset processing flag when done
      isProcessing.current = false;
    }
  };

  // Remove event listener approach - we'll rely on React's useEffect instead
  // to prevent duplicate validations

  // Check for achievements when logs/goal/prestige change directly
  // Use a useEffect with a cleanup function
  useEffect(() => {
    // Skip initial run to prevent duplicate validation with deleted logs
    const timer = setTimeout(() => {
      if (!isProcessing.current) {
        checkForAchievements();
        validateAchievements();
      }
    }, 50);
    
    return () => {
      clearTimeout(timer);
    };
  }, [logs, goal, prestige]);

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        unlocked,
        allBadges: ALL_BADGES,
        checkForAchievements,
        validateAchievements,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
}
