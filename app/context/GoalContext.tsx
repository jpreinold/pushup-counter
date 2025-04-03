// app/context/GoalContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type GoalContextType = {
  goal: number;
  setGoal: (goal: number) => void;
};

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goal, setGoalState] = useState(50);

  // Load goal from localStorage on mount
  useEffect(() => {
    const storedGoal = localStorage.getItem('dailyGoal');
    if (storedGoal) {
      setGoalState(parseInt(storedGoal));
    }
  }, []);

  const setGoal = (newGoal: number) => {
    setGoalState(newGoal);
    localStorage.setItem('dailyGoal', newGoal.toString());
  };

  return (
    <GoalContext.Provider value={{ goal, setGoal }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoal() {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error("useGoal must be used within a GoalProvider");
  }
  return context;
}
