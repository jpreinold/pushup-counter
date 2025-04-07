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
};

type GoalHistory = {
  value: number;
  startDate: string; // ISO date string
};

const GoalContext = createContext<GoalContextType | undefined>(undefined);

// Custom event for goal changes
const emitGoalsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('goalsChanged'));
  }
};

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goalHistory, setGoalHistory] = useState<GoalHistory[]>([]);
  const [currentGoal, setCurrentGoal] = useState(50);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load goal history and current goal from Supabase when user changes
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) {
        // Reset to defaults when no user
        setCurrentGoal(50);
        setGoalHistory([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch current goal from user_settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('current_goal')
          .eq('user_id', user.id)
          .single();

        if (settingsError) {
          // If no settings record, create one with default values
          if (settingsError.code === 'PGRST116') {
            // Check localStorage for migration
            const storedGoal = localStorage.getItem('dailyGoal');
            const initialGoal = storedGoal ? parseInt(storedGoal) : 50;
            
            await supabase.from('user_settings').insert({
              user_id: user.id,
              current_goal: initialGoal,
              prestige_level: 1
            });
            
            setCurrentGoal(initialGoal);
          } else {
            console.error('Error fetching current goal:', settingsError);
            // Fallback to localStorage
            const storedGoal = localStorage.getItem('dailyGoal');
            setCurrentGoal(storedGoal ? parseInt(storedGoal) : 50);
          }
        } else if (settingsData) {
          setCurrentGoal(settingsData.current_goal);
        }

        // Fetch goal history
        const { data: historyData, error: historyError } = await supabase
          .from('goal_history')
          .select('value, start_date')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        if (historyError) {
          console.error('Error fetching goal history:', historyError);
          // Fallback to localStorage
          const storedHistory = localStorage.getItem('goalHistory');
          if (storedHistory) {
            setGoalHistory(JSON.parse(storedHistory));
          } else {
            setGoalHistory([{
              value: currentGoal,
              startDate: new Date(0).toISOString() // Beginning of time
            }]);
          }
        } else if (historyData && historyData.length > 0) {
          // Convert from Supabase format to our format
          const history = historyData.map(item => ({
            value: item.value,
            startDate: new Date(item.start_date).toISOString()
          }));
          setGoalHistory(history);
        } else {
          // If no history in Supabase, initialize with current goal
          // and migrate from localStorage if available
          const storedHistory = localStorage.getItem('goalHistory');
          if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            
            // Save localStorage history to Supabase
            await Promise.all(parsedHistory.map(async (item: GoalHistory) => {
              await supabase.from('goal_history').insert({
                user_id: user.id,
                value: item.value,
                start_date: item.startDate
              });
            }));
            
            setGoalHistory(parsedHistory);
          } else {
            // No history in localStorage either, create initial entry
            const initialHistory = [{
              value: currentGoal,
              startDate: new Date(0).toISOString() // Beginning of time
            }];
            
            await supabase.from('goal_history').insert({
              user_id: user.id,
              value: currentGoal,
              start_date: new Date(0).toISOString()
            });
            
            setGoalHistory(initialHistory);
          }
        }
      } catch (error) {
        console.error('Error in goals fetch:', error);
        // Fallback completely to localStorage
        const storedGoal = localStorage.getItem('dailyGoal');
        const storedHistory = localStorage.getItem('goalHistory');
        
        setCurrentGoal(storedGoal ? parseInt(storedGoal) : 50);
        
        if (storedHistory) {
          setGoalHistory(JSON.parse(storedHistory));
        } else {
          setGoalHistory([{
            value: storedGoal ? parseInt(storedGoal) : 50,
            startDate: new Date(0).toISOString()
          }]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [user]);

  // Update current goal based on goal history whenever it changes
  useEffect(() => {
    if (goalHistory.length > 0 && !loading) {
      // Update current goal based on the most recent history entry for today or future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find the most recent entry for today or future
      const latestEntry = [...goalHistory]
        .filter(entry => new Date(entry.startDate) >= today)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      
      if (latestEntry) {
        setCurrentGoal(latestEntry.value);
        
        // Also update in Supabase if we have a user
        if (user) {
          supabase.from('user_settings')
            .upsert({ 
              user_id: user.id, 
              current_goal: latestEntry.value 
            }, { onConflict: 'user_id' })
            .then(({ error }) => {
              if (error) {
                console.error('Error updating current goal in settings:', error);
                // Fallback to localStorage
                localStorage.setItem('dailyGoal', latestEntry.value.toString());
              }
            });
        } else {
          // Fallback to localStorage if no user
          localStorage.setItem('dailyGoal', latestEntry.value.toString());
        }
      } else {
        // If no entry for today or future, use the most recent past entry
        const mostRecentPast = [...goalHistory]
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
        
        if (mostRecentPast) {
          setCurrentGoal(mostRecentPast.value);
          
          // Also update in Supabase if we have a user
          if (user) {
            supabase.from('user_settings')
              .upsert({ 
                user_id: user.id, 
                current_goal: mostRecentPast.value 
              }, { onConflict: 'user_id' })
              .then(({ error }) => {
                if (error) {
                  console.error('Error updating current goal in settings:', error);
                  // Fallback to localStorage
                  localStorage.setItem('dailyGoal', mostRecentPast.value.toString());
                }
              });
          } else {
            // Fallback to localStorage if no user
            localStorage.setItem('dailyGoal', mostRecentPast.value.toString());
          }
        }
      }
      
      // Emit goalsChanged event after goal history update
      emitGoalsChanged();
    }
  }, [goalHistory, loading, user]);

  const setGoal = async (newGoal: number, date?: Date) => {
    if (loading) return;
    
    // Use the provided date or default to today
    const targetDate = date || new Date();
    
    // Normalize the date to beginning of day
    const normalizedDate = new Date(targetDate);
    normalizedDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newHistory = [...goalHistory];
    
    // When setting from the goals page (affecting today and future)
    if (normalizedDate.getTime() === today.getTime()) {
      // This is a "default goal" change from the goals page
      // Add an entry for today
      const todayEntryIndex = newHistory.findIndex(
        entry => new Date(entry.startDate).getTime() === today.getTime()
      );
      
      if (todayEntryIndex >= 0) {
        // Update today's entry
        newHistory[todayEntryIndex].value = newGoal;
      } else {
        // Add new entry for today
        newHistory.push({
          value: newGoal,
          startDate: today.toISOString()
        });
      }
    } else {
      // This is a specific date goal change from the main page
      // Only update that specific date
      const existingEntryIndex = newHistory.findIndex(
        entry => new Date(entry.startDate).getTime() === normalizedDate.getTime()
      );
      
      if (existingEntryIndex >= 0) {
        // Update existing entry
        newHistory[existingEntryIndex].value = newGoal;
      } else {
        // Add new entry
        newHistory.push({
          value: newGoal,
          startDate: normalizedDate.toISOString()
        });
      }
    }
    
    setGoalHistory(newHistory);
    
    // Emit goal changed event explicitly to trigger achievement validation
    console.log("Goal updated, emitting goalsChanged event");
    emitGoalsChanged();
    
    // Also save to Supabase if user is logged in
    if (user) {
      try {
        // Find the new entry we just added/updated
        const newEntry = newHistory.find(entry => {
          const entryDate = new Date(entry.startDate).getTime();
          return entryDate === normalizedDate.getTime();
        });
        
        if (newEntry) {
          await supabase.from('goal_history').upsert({
            user_id: user.id,
            value: newEntry.value,
            start_date: newEntry.startDate
          }, { onConflict: 'start_date' });
          
          // Also update current_goal in user_settings if this is today
          if (normalizedDate.getTime() === today.getTime()) {
            await supabase.from('user_settings').upsert({
              user_id: user.id,
              current_goal: newGoal
            }, { onConflict: 'user_id' });
          }
        }
      } catch (error) {
        console.error('Error saving goal to Supabase:', error);
        // We already updated local state, so just log the error
      }
    }
  };

  const getGoalForDate = (date: Date) => {
    // Clone and normalize the date to beginning of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    // Find the most recent goal entry that started before or on the given date
    const relevantGoal = [...goalHistory]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .find(entry => new Date(entry.startDate) <= normalizedDate);
    
    return relevantGoal ? relevantGoal.value : currentGoal;
  };

  return (
    <GoalContext.Provider value={{ goal: currentGoal, setGoal, getGoalForDate }}>
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
