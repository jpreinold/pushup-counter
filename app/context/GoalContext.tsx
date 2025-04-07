// app/context/GoalContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

type GoalContextType = {
  goal: number;
  setGoal: (newGoal: number, date?: Date) => void;
  getGoalForDate: (date: Date) => number;
  goalHistory: GoalHistory[];
};

type GoalHistory = {
  value: number;
  startDate: string; // ISO date string
  changedAt?: string; // ISO timestamp string
};

const DEFAULT_GOAL = 50;
const GoalContext = createContext<GoalContextType | undefined>(undefined);

// Helper function to normalize date to start of day
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Helper to format date for Supabase queries
const formatDateForQuery = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Custom event for goal changes
const emitGoalsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('goalsChanged'));
  }
};

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goalHistory, setGoalHistory] = useState<GoalHistory[]>([]);
  const [currentGoal, setCurrentGoal] = useState(DEFAULT_GOAL);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Set isBrowser to true once component is mounted on client
  useEffect(() => setIsBrowser(true), []);

  // Load goal history and current goal from Supabase when user changes
  useEffect(() => {
    if (!isBrowser) return;
    
    const fetchGoals = async () => {
      if (!user) {
        setCurrentGoal(DEFAULT_GOAL);
        setGoalHistory([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 1. Fetch current goal from user_settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('current_goal')
          .eq('user_id', user.id)
          .single();

        // Handle settings data
        if (settingsError) {
          if (settingsError.code === 'PGRST116') {
            // Create default settings if none exist
            await supabase.from('user_settings').insert({
              user_id: user.id,
              current_goal: DEFAULT_GOAL,
              prestige_level: 1
            });
            setCurrentGoal(DEFAULT_GOAL);
          } else {
            console.error('Error fetching goal settings:', settingsError);
            setCurrentGoal(DEFAULT_GOAL);
          }
        } else if (settingsData) {
          setCurrentGoal(settingsData.current_goal);
        }

        // 2. Fetch goal history
        const { data: historyData, error: historyError } = await supabase
          .from('goal_history')
          .select('value, start_date, changed_at')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false })
          .order('changed_at', { ascending: false });

        if (historyError) {
          console.error('Error fetching goal history:', historyError);
          setGoalHistory([{
            value: currentGoal,
            startDate: new Date(0).toISOString()
          }]);
        } else if (historyData && historyData.length > 0) {
          // Group goals by date to handle potential duplicates
          const goalsByDate = new Map<string, {value: number, timestamp: string, changedAt: string}>();
          
          historyData.forEach(item => {
            const date = new Date(item.start_date);
            const dateStr = formatDateForQuery(date);
            const timestamp = date.toISOString();
            const changedAt = item.changed_at || timestamp;
            
            // Keep the most recent entry for each date based on changed_at
            if (!goalsByDate.has(dateStr) || 
                new Date(changedAt) > new Date(goalsByDate.get(dateStr)!.changedAt)) {
              goalsByDate.set(dateStr, {value: item.value, timestamp, changedAt});
            }
          });
          
          // Convert the map back to our history format
          const history = Array.from(goalsByDate.entries())
            .map(([_, {value, timestamp, changedAt}]) => ({
              value,
              startDate: timestamp,
              changedAt
            }));
          
          setGoalHistory(history);
        } else {
          // If no history, initialize with default
          const initialHistory = [{
            value: currentGoal,
            startDate: new Date(0).toISOString()
          }];
          
          // Create initial entry if doesn't exist
          const { data } = await supabase
            .from('goal_history')
            .select('id')
            .eq('user_id', user.id)
            .eq('start_date', new Date(0).toISOString());
          
          if (!data || data.length === 0) {
            await supabase.from('goal_history').insert({
              user_id: user.id,
              value: currentGoal,
              start_date: new Date(0).toISOString(),
              changed_at: new Date().toISOString()
            });
          }
          
          setGoalHistory(initialHistory);
        }
      } catch (error) {
        console.error('Error in goals fetch:', error);
        setCurrentGoal(DEFAULT_GOAL);
        setGoalHistory([{
          value: DEFAULT_GOAL,
          startDate: new Date(0).toISOString()
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [user, isBrowser]);

  // Update current goal based on goal history whenever it changes
  useEffect(() => {
    if (!isBrowser || !goalHistory.length || loading) return;
    
    const today = normalizeDate(new Date());
    
    // Find the most recent entry for today or future
    const latestEntry = [...goalHistory]
      .filter(entry => new Date(entry.startDate) >= today)
      .sort((a, b) => {
        // First sort by date
        const dateCompare = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        // If dates are equal, sort by changed_at
        if (a.changedAt && b.changedAt) {
          return new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime();
        }
        return 0;
      })[0];
    
    if (latestEntry) {
      setCurrentGoal(latestEntry.value);
      
      // Update in Supabase if user is logged in
      if (user) {
        supabase.from('user_settings')
          .upsert({ 
            user_id: user.id, 
            current_goal: latestEntry.value 
          }, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) console.error('Error updating goal settings:', error);
          });
      }
    } else {
      // If no entry for today or future, use the most recent past entry
      const mostRecentPast = [...goalHistory]
        .sort((a, b) => {
          // First sort by date
          const dateCompare = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          if (dateCompare !== 0) return dateCompare;
          
          // If dates are equal, sort by changed_at
          if (a.changedAt && b.changedAt) {
            return new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime();
          }
          return 0;
        })[0];
      
      if (mostRecentPast) {
        setCurrentGoal(mostRecentPast.value);
        
        // Update in Supabase if user is logged in
        if (user) {
          supabase.from('user_settings')
            .upsert({ 
              user_id: user.id, 
              current_goal: mostRecentPast.value 
            }, { onConflict: 'user_id' })
            .then(({ error }) => {
              if (error) console.error('Error updating goal settings:', error);
            });
        }
      }
    }
    
    emitGoalsChanged();
  }, [goalHistory, loading, user, isBrowser]);

  const setGoal = async (newGoal: number, date?: Date) => {
    if (loading) return;
    
    // Use the provided date or default to today
    const targetDate = date || new Date();
    const normalizedDate = normalizeDate(targetDate);
    const today = normalizeDate(new Date());
    const now = new Date();
    
    // Update local state first for immediate UI feedback
    const newHistory = [...goalHistory];
    const isToday = !date || normalizedDate.getTime() === today.getTime();
    
    // Find existing entry for the target date
    const existingEntryIndex = newHistory.findIndex(entry => {
      const entryDate = new Date(entry.startDate);
      return (
        entryDate.getFullYear() === normalizedDate.getFullYear() &&
        entryDate.getMonth() === normalizedDate.getMonth() &&
        entryDate.getDate() === normalizedDate.getDate()
      );
    });
    
    if (existingEntryIndex >= 0) {
      // Update existing entry
      newHistory[existingEntryIndex].value = newGoal;
      newHistory[existingEntryIndex].changedAt = now.toISOString();
    } else {
      // Add new entry
      newHistory.push({
        value: newGoal,
        startDate: normalizedDate.toISOString(),
        changedAt: now.toISOString()
      });
    }
    
    // Update local state
    setGoalHistory(newHistory);
    if (isToday) setCurrentGoal(newGoal);
    emitGoalsChanged();
    
    // Save to Supabase if user is logged in
    if (user) {
      try {
        // 1. Always update user_settings for default goal
        if (isToday) {
          await supabase.from('user_settings').upsert({
            user_id: user.id,
            current_goal: newGoal
          }, { onConflict: 'user_id' });
        }
        
        // 2. Upsert into goal_history with current timestamp
        await supabase.from('goal_history').upsert({
          user_id: user.id,
          value: newGoal,
          start_date: normalizedDate.toISOString(),
          changed_at: now.toISOString()
        }, {
          onConflict: 'user_id,start_date',
          ignoreDuplicates: false
        });
      } catch (error) {
        console.error('Error saving goal to Supabase:', error);
      }
    }
  };

  const getGoalForDate = (date: Date) => {
    if (typeof window === 'undefined' || !goalHistory.length) {
      return currentGoal;
    }
    
    const normalizedDate = normalizeDate(date);
    
    // 1. Look for exact match for this date
    const exactMatch = goalHistory.find(entry => {
      const entryDate = new Date(entry.startDate);
      return (
        entryDate.getFullYear() === normalizedDate.getFullYear() &&
        entryDate.getMonth() === normalizedDate.getMonth() &&
        entryDate.getDate() === normalizedDate.getDate()
      );
    });
    
    if (exactMatch) return exactMatch.value;
    
    // 2. Find most recent goal entry that started before the given date
    const relevantGoal = [...goalHistory]
      .sort((a, b) => {
        // First sort by date
        const dateCompare = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        // If dates are equal, sort by changed_at
        if (a.changedAt && b.changedAt) {
          return new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime();
        }
        return 0;
      })
      .find(entry => new Date(entry.startDate).getTime() <= normalizedDate.getTime());
    
    if (relevantGoal) return relevantGoal.value;
    
    // 3. Fallback to current goal
    return currentGoal;
  };

  // Only provide real implementation once in browser
  if (!isBrowser) {
    return (
      <GoalContext.Provider value={{ 
        goal: DEFAULT_GOAL, 
        setGoal: () => {}, 
        getGoalForDate: () => DEFAULT_GOAL,
        goalHistory: []
      }}>
        {children}
      </GoalContext.Provider>
    );
  }

  return (
    <GoalContext.Provider value={{ 
      goal: currentGoal, 
      setGoal, 
      getGoalForDate,
      goalHistory
    }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoal() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error("useGoal must be used within a GoalProvider");
  }
  return context;
}
