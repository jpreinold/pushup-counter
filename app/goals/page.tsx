"use client"

import { useState, useEffect } from 'react';
import { useGoal } from '../context/GoalContext';
import GoalHistory from '../components/GoalHistory';

export default function GoalsPage() {
  const { goal, setGoal, getGoalForDate } = useGoal();
  const [newGoal, setNewGoal] = useState<string>(goal.toString());
  const [message, setMessage] = useState('');

  // Update newGoal when the goal changes
  useEffect(() => {
    setNewGoal(goal.toString());
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalValue = parseInt(newGoal);
    if (!isNaN(goalValue) && goalValue >= 0) {
      console.log(`Goals page: Setting new goal value to ${goalValue}`);
      
      // Set goal for today and future dates
      const today = new Date();
      setGoal(goalValue, today);
      
      setMessage(`Goal updated to ${goalValue}! Refresh to verify persistence.`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Update Daily Goal</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This will update your goal for today and future dates. Past dates will keep their existing goals.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <label className="mb-2 text-gray-700 dark:text-gray-200">Daily Pushup Goal:</label>
          <input
            type="number"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="p-2 border dark:border-gray-600 rounded mb-4 dark:bg-gray-700 dark:text-white"
            min="0"
          />
          <button 
            type="submit" 
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors duration-200"
            disabled={isNaN(parseInt(newGoal)) || parseInt(newGoal) < 0}
          >
            Update Goal
          </button>
        </form>
        {message && <p className="mt-4 text-green-600 dark:text-green-400">{message}</p>}
        <p className="mt-2 text-gray-500 dark:text-gray-400">Current goal: {goal} pushups</p>
      </div>
      
      <GoalHistory />
    </div>
  );
}
