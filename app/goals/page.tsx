

"use client"

import { useState } from 'react';
import { useGoal } from '../context/GoalContext';

export default function GoalsPage() {
  const { goal, setGoal } = useGoal();
  const [newGoal, setNewGoal] = useState(goal);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoal(newGoal);
    setMessage('Goal updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Update Daily Goal</h2>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <label className="mb-2">Daily Pushup Goal:</label>
        <input
          type="number"
          value={newGoal}
          onChange={(e) => setNewGoal(parseInt(e.target.value))}
          className="p-2 border rounded mb-4"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Update Goal
        </button>
      </form>
      {message && <p className="mt-4 text-green-600">{message}</p>}
      <p className="mt-2 text-gray-500">Current goal: {goal} pushups</p>
    </div>
  );
}
