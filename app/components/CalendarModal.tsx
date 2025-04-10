import { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaDumbbell, FaFire } from "react-icons/fa";

interface PushupData {
  date: string;
  count: number;
}

interface CalendarModalProps {
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  pushupData?: PushupData[];
  logs: Array<{id: string, timestamp: string, count: number}>;
}

export default function CalendarModal({ onClose, onSelectDate, pushupData = [], logs }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Debug log
  console.log("Calendar pushup data:", pushupData);
  
  // Get first day of month and total days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Create calendar grid
  const days = [];
  const startDay = firstDay.getDay();
  
  // Add empty cells for days before first of month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  
  // Add days of month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  // Function to get pushup count for a specific date
  const getPushupCount = (date: Date): number => {
    if (!date) return 0;
    
    // Create a date string in YYYY-MM-DD format for the calendar date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Find matching entry in pushup data
    const entry = pushupData.find(data => data.date === dateString);
    
    // Debug
    console.log(`Checking date: ${dateString}, Found: ${entry ? entry.count : 0}`);
    
    return entry ? entry.count : 0;
  };

  // Function to get logs for a given day
  const getLogsForDay = (day: Date) =>
    logs.filter((log) => {
      try {
        const logDate = new Date(log.timestamp);
        return (
          logDate.getFullYear() === day.getFullYear() &&
          logDate.getMonth() === day.getMonth() &&
          logDate.getDate() === day.getDate()
        );
      } catch (e) {
        return false;
      }
    });

  // Function to calculate streak for a date
  const calculateStreak = (date: Date): number => {
    if (date > today) return 0;
    
    // Check if there are logs for the current date
    const hasLogsForCurrentDate = getLogsForDay(date).length > 0;
    
    if (!hasLogsForCurrentDate) return 0;
    
    // Count current date as part of streak
    let streak = 1;
    
    // Check previous days
    let checkDate = new Date(date);
    while (true) {
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Check if there are logs for this day
      const hasLogs = getLogsForDay(checkDate).length > 0;
      
      if (hasLogs) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Function to check if a date is the start of a streak
  const isStartOfStreak = (date: Date): boolean => {
    if (date > today) return false;
    
    const streak = calculateStreak(date);
    if (streak <= 1) return false;
    
    // Check if the day before has no logs
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    
    return getLogsForDay(prevDay).length === 0;
  };

  // Function to check if a date is part of a streak
  const isPartOfStreak = (date: Date): boolean => {
    if (date > today) return false;
    return calculateStreak(date) > 1;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center backdrop-blur-sm bg-black/25 pt-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-4 w-11/12 sm:w-96 shadow-lg h-fit">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select a Date</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2">
              <FaChevronLeft />
            </button>
            <span className="font-semibold">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2">
              <FaChevronRight />
            </button>
          </div>
          
          {/* Calendar Legend */}
          <div className="flex justify-end items-center mb-2 text-xs">
            <div className="flex items-center mr-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-300 to-red-500 mr-1"></div>
              <span>Streak</span>
            </div>
            <div className="flex items-center">
              <FaDumbbell className="text-blue-600 mr-1" size={10} />
              <span>Workout</span>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium py-1">
                {day}
              </div>
            ))}
            {days.map((date, index) => {
              // Ensure we're comparing dates properly by setting hours to 0
              const dateToCompare = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
              const isFutureDate = dateToCompare ? dateToCompare > today : false;
              
              // Only get pushup count if it's not a future date
              const pushupCount = (date && !isFutureDate) ? getPushupCount(date) : 0;
              
              // Check if date is part of a streak
              const streak = date ? calculateStreak(date) : 0;
              const isStreak = streak > 1;
              const streakStart = date ? isStartOfStreak(date) : false;
              
              return (
                <div key={index} className="relative">
                  <button
                    onClick={() => date && !isFutureDate && onSelectDate(date)}
                    disabled={isFutureDate}
                    className={`
                      p-2 text-center rounded w-full h-full flex flex-col items-center justify-start
                      ${!date ? 'invisible' : ''}
                      ${date?.toDateString() === today.toDateString() ? 'bg-blue-100' : ''}
                      ${isStreak ? 'bg-gradient-to-r from-orange-100 to-red-100' : ''}
                      ${isFutureDate ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                      relative overflow-hidden
                    `}
                  >
                    <span className={`mb-1 ${isStreak ? 'font-medium' : ''}`}>
                      {date?.getDate()}
                    </span>
                    
                    {/* Streak indicator */}
                    {isStreak && (
                      <div className="absolute top-0 right-0 p-0.5">
                        <FaFire className="text-orange-500" size={10} />
                      </div>
                    )}
                    
                    {/* Pushup count indicator */}
                    {date && !isFutureDate && pushupCount > 0 && (
                      <div className="flex items-center text-xs text-blue-600">
                        <FaDumbbell className="mr-1 text-blue-600" size={12} />
                        <span>{pushupCount}</span>
                      </div>
                    )}
                    
                    {/* Show streak count on hover */}
                    {isStreak && (
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400/80 to-red-500/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                        <div className="flex items-center">
                          <FaFire className="mr-1" />
                          <span>{streak}</span>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 