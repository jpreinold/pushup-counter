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
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

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
  const { user } = useAuth();
  const isProcessing = useRef(false);
  const isInitialLoad = useRef(true);
  const processedBadges = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const lastProcessTime = useRef(0);

  // Initialize achievements
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Calculate unlocked IDs from achievements
  const [unlocked, setUnlocked] = useState<string[]>([]);

  // Reset processedBadges after 5 minutes to prevent stale state
  useEffect(() => {
    const resetInterval = setInterval(() => {
      if (processedBadges.current.size > 0) {
        console.log(`Resetting processed badges cache (had ${processedBadges.current.size} entries)`);
        processedBadges.current.clear();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(resetInterval);
  }, []);

  // Fetch achievements from Supabase when user changes
  useEffect(() => {
    if (user) {
      fetchAchievements();
    } else {
      setAchievements([]);
      setUnlocked([]);
      setLoading(false);
    }
  }, [user]);

  // Listen for log changes and validate achievements
  useEffect(() => {
    const handleLogsChanged = () => {
      if (user && !loading) {
        console.log("Logs changed event received, processing achievements");
        console.log("Current logs count:", logs.length);
        
        // Give React a moment to fully update the logs state
        setTimeout(() => {
          console.log("Starting delayed achievement processing");
          console.log("Logs count at processing time:", logs.length);
          console.log("Logs details:", logs.map(l => ({ 
            date: new Date(l.timestamp).toLocaleDateString(),
            time: new Date(l.timestamp).toLocaleTimeString(),
            count: l.count 
          })));
          
          // Process all badges when logs change
          processAchievements('logs');
        }, 500); // Increased delay to ensure state is fully updated
      }
    };

    window.addEventListener('logsChanged', handleLogsChanged);
    
    return () => {
      window.removeEventListener('logsChanged', handleLogsChanged);
    };
  }, [user, loading, logs]); // Remove processAchievements from dependencies

  // Listen for goal changes and validate achievements
  useEffect(() => {
    const handleGoalsChanged = () => {
      if (user && !loading) {
        console.log("Goals changed event received, processing achievements");
        console.log("Current goal:", goal);
        
        // Give React a moment to fully update the goal state
        setTimeout(() => {
          console.log("Starting delayed achievement processing for goal change");
          console.log("Current goal at processing time:", goal);
          
          // Only process goal-related badges when goal changes
          processAchievements('goal');
        }, 500); // Use the same delay as for logs changes
      }
    };

    window.addEventListener('goalsChanged', handleGoalsChanged);
    
    return () => {
      window.removeEventListener('goalsChanged', handleGoalsChanged);
    };
  }, [user, loading, goal]);

  // Reset initial load flag after component mounts
  useEffect(() => {
    // Set isInitialLoad to true on mount
    isInitialLoad.current = true;
    
    // Set a small delay to allow the initial render and data loading to complete
    const timer = setTimeout(() => {
      console.log("Initial load complete, enabling notifications");
      isInitialLoad.current = false;
    }, 2000); // Increased delay to allow data loading
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch achievements from Supabase
  const fetchAchievements = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("Fetching achievements from Supabase...");
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Convert from Supabase format to our Achievement format
        // All fetched achievements are earned, since we only store earned ones
        const achievementList = data.map(item => ({
          id: item.achievement_id,
          title: ALL_BADGES.find(b => b.id === item.achievement_id)?.name || '',
          description: ALL_BADGES.find(b => b.id === item.achievement_id)?.description || '',
          icon: ALL_BADGES.find(b => b.id === item.achievement_id)?.emoji || '🏆',
          earned: true, // All stored achievements are earned
          date: item.earned_date
        }));
        
        console.log(`Found ${achievementList.length} earned achievements in database`);
        setAchievements(achievementList);
        
        // Update unlocked IDs - all achievements are unlocked since we only store earned ones
        setUnlocked(achievementList.map(achievement => achievement.id));
      } else {
        console.log("No achievements found in database");
        // If no achievements found in Supabase, try to migrate from localStorage
        const saved = localStorage.getItem("achievements");
        if (saved) {
          try {
            const localAchievements = JSON.parse(saved);
            if (localAchievements.length > 0) {
              console.log(`Migrating ${localAchievements.length} achievements from localStorage`);
              // Save local achievements to Supabase
              await Promise.all(localAchievements.map(async (achievement: Achievement) => {
                if (achievement.earned) {
                  await supabase.from('achievements').upsert({
                    user_id: user.id,
                    achievement_id: achievement.id,
                    badge_id: achievement.id,
                    earned: true,
                    earned_date: achievement.date || new Date().toISOString()
                  }, { onConflict: 'user_id,achievement_id' });
                }
              }));
              
              // Fetch again after migration
              fetchAchievements();
              return;
            }
          } catch (e) {
            console.error("Failed to parse saved achievements", e);
          }
        }
        
        setAchievements([]);
        setUnlocked([]);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      
      // Fallback to localStorage if Supabase fails
      const saved = localStorage.getItem("achievements");
      if (saved) {
        try {
          setAchievements(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved achievements", e);
          setAchievements([]);
        }
      } else {
        setAchievements([]);
      }
    } finally {
      setLoading(false);
      // Set initial load to false after a delay
      setTimeout(() => {
        console.log("Setting initial load flag to false");
        isInitialLoad.current = false;
      }, 1000);
    }
  };

  // Update unlocked IDs whenever achievements change
  useEffect(() => {
    const unlockedIds = achievements
      .filter(achievement => achievement.earned)
      .map(achievement => achievement.id);
    
    setUnlocked(unlockedIds);
  }, [achievements]);

  // Generate derived stats for badge validation
  const getDerivedStats = (): DerivedStats => {
    console.log("Calculating derived stats from logs", logs.length);
    
    // Group logs by date (using YYYY-MM-DD format)
    const dayCounts: { [date: string]: number } = {};
    let totalPushups = 0;
    let goalsHit = 0;
    
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
      
      dayCounts[dateKey] = (dayCounts[dateKey] || 0) + log.count;
      totalPushups += log.count;
    });
    
    // Count days where goal was met
    Object.entries(dayCounts).forEach(([date, count]) => {
      if (count >= goal) {
        goalsHit++;
      }
    });
    
    const result = {
      totalPushups,
      daysLogged: Object.keys(dayCounts).length,
      goalsHit,
      dayCounts
    };
    
    console.log("Derived stats:", result);
    return result;
  };

  // Save achievement to Supabase
  const saveAchievement = async (achievement: Achievement): Promise<void> => {
    if (!user) return;
    
    try {
      console.log("Saving achievement to Supabase:", achievement.id, achievement.earned);
      
      if (achievement.earned) {
        // Insert or update earned achievement
        const { error } = await supabase
          .from('achievements')
          .upsert({
            user_id: user.id,
            achievement_id: achievement.id,
            badge_id: achievement.id,
            earned: true,
            earned_date: achievement.date || new Date().toISOString()
          }, { 
            onConflict: 'user_id,achievement_id'
          });
        
        if (error) {
          console.error('Error saving achievement:', error);
        } else {
          console.log('Achievement saved successfully:', achievement.id);
        }
      } else {
        // Delete the achievement if it's not earned
        const { error } = await supabase
          .from('achievements')
          .delete()
          .eq('user_id', user.id)
          .eq('achievement_id', achievement.id);
        
        if (error) {
          console.error('Error deleting achievement:', error);
        } else {
          console.log('Achievement deleted successfully:', achievement.id);
        }
      }
    } catch (error) {
      console.error('Error saving/deleting achievement:', error);
    }
  };

  // Combined function to process achievements
  const processAchievements = async (trigger: 'logs' | 'goal' | 'all' = 'all') => {
    if (isProcessing.current || !user || loading) return;
    console.log(`Starting achievement processing (trigger: ${trigger})...`);
    isProcessing.current = true;
    
    try {
      // First, sync with database to ensure local state is accurate
      await syncAchievementsWithDatabase();
      
      const stats = getDerivedStats();
      console.log("Current stats:", stats);
      
      // Get all badges for current prestige level
      const availableBadges = ALL_BADGES.filter(
        badge => badge.rank <= prestige
      );
      
      // Filter badges based on trigger
      const badgesToCheck = availableBadges.filter(badge => {
        if (trigger === 'all') return true;
        
        // For goal changes, only check badges that depend on goals
        if (trigger === 'goal') {
          // These are the badge IDs that are directly affected by goal changes
          const goalRelatedBadges = ['daily_goal', 'five_goals', 'goal_getter'];
          return goalRelatedBadges.includes(badge.id);
        }
        
        return true;
      });
      
      console.log(`Checking ${badgesToCheck.length} badges based on ${trigger} trigger`);
      
      // Create a working copy of achievements
      const updatedAchievements = [...achievements];
      const pendingNotifications: Array<{type: string, message: string}> = [];
      
      // Process all badges in one go
      for (const badge of badgesToCheck) {
        const qualifies = badge.condition(logs, stats);
        console.log(`Badge ${badge.id} (${badge.name}) qualifies: ${qualifies}`);
        
        // Find if we already have this achievement
        const index = updatedAchievements.findIndex(a => a.id === badge.id);
        const existing = index !== -1;
        const wasEarned = existing && updatedAchievements[index].earned;
        
        // Case 1: Currently earned but no longer qualifies
        if (wasEarned && !qualifies) {
          console.log(`Revoking badge: ${badge.id}`);
          
          // Update our working copy
          updatedAchievements[index] = {
            ...updatedAchievements[index],
            earned: false,
            date: undefined
          };
          
          // Add notification if not initial load and wasn't processed recently
          if (!isInitialLoad.current && !processedBadges.current.has(`revoke_${badge.id}`)) {
            pendingNotifications.push({
              type: "error",
              message: `${badge.emoji} Achievement Lost: ${badge.name}`
            });
            // Mark as processed
            processedBadges.current.add(`revoke_${badge.id}`);
          }
          
          // Save to Supabase (this will delete it)
          await saveAchievement({
            id: badge.id,
            title: badge.name,
            description: badge.description,
            icon: badge.emoji,
            earned: false
          });
        }
        // Case 2: Not currently earned but now qualifies
        else if ((!existing || !wasEarned) && qualifies) {
          console.log(`Awarding badge: ${badge.id}`);
          
          const achievement = {
            id: badge.id,
            title: badge.name,
            description: badge.description,
            icon: badge.emoji,
            earned: true,
            date: new Date().toISOString()
          };
          
          // Update our working copy
          if (existing) {
            updatedAchievements[index] = achievement;
          } else {
            updatedAchievements.push(achievement);
          }
          
          // Add notification if not initial load and wasn't processed recently
          if (!isInitialLoad.current && !processedBadges.current.has(`earn_${badge.id}`)) {
            pendingNotifications.push({
              type: "success",
              message: `${badge.emoji} Achievement Unlocked: ${badge.name}`
            });
            // Mark as processed
            processedBadges.current.add(`earn_${badge.id}`);
          }
          
          // Save to Supabase
          await saveAchievement(achievement);
        }
        // Otherwise, no change needed
      }
      
      // Update state if achievements were changed
      if (JSON.stringify(updatedAchievements) !== JSON.stringify(achievements)) {
        console.log("Updating achievements state");
        
        // Log what specific achievements were earned or lost
        const earned = updatedAchievements.filter(a => a.earned && !achievements.some(b => b.id === a.id && b.earned));
        const lost = achievements.filter(a => a.earned && !updatedAchievements.some(b => b.id === a.id && b.earned));
        
        if (earned.length > 0) {
          console.log("Newly earned achievements:", earned.map(a => a.id).join(", "));
        }
        
        if (lost.length > 0) {
          console.log("Lost achievements:", lost.map(a => a.id).join(", "));
        }
        
        // Update state first
        setAchievements(updatedAchievements);
        
        // IMPORTANT: Show notifications immediately - don't wait for state update
        if (!isInitialLoad.current && pendingNotifications.length > 0) {
          console.log(`Showing ${pendingNotifications.length} notifications immediately`);
          
          // Don't use setTimeout - display toasts immediately
          // Process notifications one by one
          for (const note of pendingNotifications) {
            console.log(`Showing notification: ${note.message}`);
            
            // Using toast.success or toast.error directly bypasses any potential issues
            if (note.type === "error") {
              toast.error(note.message, {
                duration: 4000,  // Longer duration
                position: 'top-center',  // More visible position
              });
            } else {
              toast.success(note.message, {
                duration: 4000,  // Longer duration
                position: 'top-center',  // More visible position
              });
              
              // Trigger confetti for earned achievements
              if (typeof window !== 'undefined') {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              }
            }
          }
        }
      } else {
        console.log("No achievement changes detected");
      }
    } finally {
      console.log("Achievement processing completed");
      isProcessing.current = false;
    }
  };

  // Sync local achievements with the database to ensure consistency
  const syncAchievementsWithDatabase = async () => {
    if (!user) return;
    
    try {
      console.log("Syncing achievements with database...");
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching achievements for sync:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log("No achievements in database to sync");
        return;
      }
      
      // Convert database records to Achievement objects
      const dbAchievements = data.map(item => ({
        id: item.achievement_id,
        title: ALL_BADGES.find(b => b.id === item.achievement_id)?.name || '',
        description: ALL_BADGES.find(b => b.id === item.achievement_id)?.description || '',
        icon: ALL_BADGES.find(b => b.id === item.achievement_id)?.emoji || '🏆',
        earned: true,
        date: item.earned_date
      }));
      
      // Find missing achievements (in DB but not in local state)
      const localAchievementIds = new Set(achievements.map(a => a.id));
      const missingAchievements = dbAchievements.filter(a => !localAchievementIds.has(a.id));
      
      if (missingAchievements.length > 0) {
        console.log(`Found ${missingAchievements.length} achievements in DB that are missing from local state`);
        
        // Add missing achievements to state silently (without notifications)
        // Notifications will be handled in the main achievement processing
        setAchievements(prevAchievements => [...prevAchievements, ...missingAchievements]);
      }
      
      // Find achievements that should be removed (in local state as earned but not in DB)
      const dbAchievementIds = new Set(data.map(item => item.achievement_id));
      const achievementsToRemove = achievements.filter(a => a.earned && !dbAchievementIds.has(a.id));
      
      if (achievementsToRemove.length > 0) {
        console.log(`Found ${achievementsToRemove.length} achievements in local state that are missing from DB`);
        
        // Update state to mark achievements as not earned
        // Notifications will be handled in the main achievement processing
        setAchievements(prevAchievements => 
          prevAchievements.map(a => 
            achievementsToRemove.some(remove => remove.id === a.id) 
              ? { ...a, earned: false, date: undefined } 
              : a
          )
        );
      }
    } catch (error) {
      console.error('Error syncing achievements with database:', error);
    }
  };

  // Keep existing individual functions for backward compatibility and for calling from other places
  const checkForAchievements = () => {
    // If already processing, don't start another process
    if (isProcessing.current) return;
    processAchievements('all');
  };
  
  const validateAchievements = () => {
    // If already processing, don't start another process
    if (isProcessing.current) return;
    processAchievements('all');
  };

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
