import { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaDumbbell, FaFire } from "react-icons/fa";
import { format } from 'date-fns';

interface PushupData {
  date: string;
  count: number;
}

interface StatsCalendarModalProps {
  onClose: () => void;
  onSelectDate: (startDate: Date, endDate: Date) => void;
  pushupData?: PushupData[];
  logs: Array<{id: string, timestamp: string, count: number}>;
}

export default function StatsCalendarModal({ onClose, onSelectDate, pushupData = [], logs }: StatsCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
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

  // Function to check if a date is in the selected range
  const isInRange = (date: Date): boolean => {
    if (!startDate) return false;
    if (!endDate) return date.getTime() === startDate.getTime();
    
    const dateTime = date.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);
    
    return dateTime >= minTime && dateTime <= maxTime;
  };

  // Function to handle date selection
  const handleDateClick = (date: Date) => {
    if (date > today) return; // Don't allow future dates

    // If no start date is selected, set it
    if (!startDate) {
      setStartDate(date);
      return;
    }

    // If clicking on the start date, clear the range
    if (date.getTime() === startDate.getTime()) {
      setStartDate(null);
      setEndDate(null);
      return;
    }

    // If clicking on the end date, clear just the end date
    if (endDate && date.getTime() === endDate.getTime()) {
      setEndDate(null);
      return;
    }

    // Set the end date
    setEndDate(date);
  };

  // Function to format the date range display
  const formatDateRange = (): string => {
    if (!startDate) return "Select a date range";
    if (!endDate) return `From ${format(startDate, 'MMM d, yyyy')}`;
    
    // Ensure dates are in chronological order
    const [earlierDate, laterDate] = startDate.getTime() < endDate.getTime() 
      ? [startDate, endDate] 
      : [endDate, startDate];
    
    return `${format(earlierDate, 'MMM d, yyyy')} - ${format(laterDate, 'MMM d, yyyy')}`;
  };

  // Function to handle range submission
  const handleSubmit = () => {
    if (startDate) {
      // If only start date is selected, use it as both start and end
      const end = endDate || startDate;
      onSelectDate(startDate, end);
      onClose();
    }
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-11/12 sm:w-96 shadow-lg h-fit">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Date Range</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
              <FaChevronLeft />
            </button>
            <span className="font-semibold text-gray-900 dark:text-white">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
              <FaChevronRight />
            </button>
          </div>

          {/* Date Range Display */}
          <div className="mb-4">
            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-center">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                {formatDateRange()}
              </p>
            </div>
            {startDate && (
              <button
                onClick={handleSubmit}
                className="w-full mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors"
              >
                Apply Range
              </button>
            )}
          </div>
          
          {/* Calendar Legend */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-300 to-red-500 mr-1"></div>
              <span className="text-gray-600 dark:text-gray-300">Streak</span>
            </div>
            <div className="flex items-center">
              <FaDumbbell className="text-blue-600 dark:text-blue-400 mr-1" size={10} />
              <span className="text-gray-600 dark:text-gray-300">Workout</span>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium py-1 text-gray-600 dark:text-gray-400">
                {day}
              </div>
            ))}
            
            {days.map((date, index) => {
              if (!date) return <div key={index} className="invisible" />;

              const dateToCompare = new Date(date.getFullYear(), date.getMonth(), date.getDate());
              const isFutureDate = dateToCompare > today;
              const pushupCount = !isFutureDate ? getPushupCount(date) : 0;
              const streak = !isFutureDate ? calculateStreak(date) : 0;
              const isStreak = streak > 1;
              const isSelected = startDate && date.getTime() === startDate.getTime();
              const isEndSelected = endDate && date.getTime() === endDate.getTime();
              const inRange = isInRange(date);

              return (
                <div key={index} className="relative">
                  <button
                    onClick={() => handleDateClick(date)}
                    disabled={isFutureDate}
                    className={`
                      p-2 text-center rounded w-full h-full flex flex-col items-center justify-start relative overflow-hidden
                      ${isFutureDate ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'cursor-pointer'}
                      ${date.getTime() === today.getTime() ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''}
                      ${!isFutureDate && !isStreak && !inRange ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                      ${isStreak ? 'bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50' : ''}
                      ${!isStreak && pushupCount > 0 ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : ''}
                      ${inRange ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300' : ''}
                      ${(isSelected || isEndSelected) ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200' : ''}
                      ${!isStreak && !pushupCount && !inRange && !isFutureDate ? 'text-gray-700 dark:text-gray-300' : ''}
                    `}
                  >
                    <span className={`text-sm ${isStreak ? 'text-orange-600 dark:text-orange-300 font-medium' : ''}`}>
                      {date.getDate()}
                    </span>
                    {pushupCount > 0 && (
                      <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1">
                        <FaDumbbell className="mr-0.5" size={10} />
                        <span>{pushupCount}</span>
                      </div>
                    )}
                    {isStreak && (
                      <>
                        <div className="absolute top-0 right-0 p-0.5">
                          <FaFire className="text-orange-500 dark:text-orange-400" size={10} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/80 to-red-500/80 dark:from-orange-600/90 dark:to-red-700/90 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <div className="flex items-center">
                            <FaFire className="mr-1" />
                            <span className="font-bold">{streak}</span>
                          </div>
                        </div>
                      </>
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