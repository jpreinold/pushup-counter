import { useState } from 'react';

interface StreakCounterProps {
  streak: number;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Only show if streak is greater than 1
  if (streak <= 1) return null;
  
  return (
    <div 
      className="absolute top-4 right-4 flex items-center bg-orange-100 dark:bg-orange-900 px-3 py-1 rounded-full cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span role="img" aria-label="fire" className="mr-1">🔥</span>
      <span className="font-semibold text-orange-600 dark:text-orange-400">{streak}</span>
      
      {/* Custom Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm py-2 px-3 rounded shadow-lg z-50 whitespace-nowrap border border-gray-200 dark:border-gray-700">
          <div className="absolute right-3 -top-2 w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 border-l border-t border-gray-200 dark:border-gray-700"></div>
          <span>{streak} day streak! Keep going!</span>
        </div>
      )}
    </div>
  );
} 