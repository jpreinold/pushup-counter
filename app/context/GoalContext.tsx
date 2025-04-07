// app/context/GoalContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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

  // Load goal history from localStorage on mount
  useEffect(() => {
    const storedGoalHistory = localStorage.getItem('goalHistory');
    if (storedGoalHistory) {
      setGoalHistory(JSON.parse(storedGoalHistory));
    } else {
      // Initialize with current goal if no history exists
      const storedGoal = localStorage.getItem('dailyGoal');
      const initialGoal = storedGoal ? parseInt(storedGoal) : 50;
      setCurrentGoal(initialGoal);
      setGoalHistory([{
        value: initialGoal,
        startDate: new Date(0).toISOString() // Beginning of time
      }]);
    }
  }, []);

  // Save goal history to localStorage whenever it changes
  useEffect(() => {
    if (goalHistory.length > 0) {
      localStorage.setItem('goalHistory', JSON.stringify(goalHistory));
      
      // Update current goal based on the most recent history entry for today or future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find the most recent entry for today or future
      const latestEntry = [...goalHistory]
        .filter(entry => new Date(entry.startDate) >= today)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      
      if (latestEntry) {
        setCurrentGoal(latestEntry.value);
        localStorage.setItem('dailyGoal', latestEntry.value.toString());
      } else {
        // If no entry for today or future, use the most recent past entry
        const mostRecentPast = [...goalHistory]
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
        
        if (mostRecentPast) {
          setCurrentGoal(mostRecentPast.value);
          localStorage.setItem('dailyGoal', mostRecentPast.value.toString());
        }
      }
      
      // Emit goalsChanged event after goal history update
      emitGoalsChanged();
    }
  }, [goalHistory]);

  const setGoal = (newGoal: number, date?: Date) => {
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
