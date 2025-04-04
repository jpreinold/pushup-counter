"use client";

import { useState, useRef, useEffect } from "react";
import { useGoal } from "./context/GoalContext";
import { useLogs } from "./context/LogContext";
import { useAchievements } from "./context/AchievementContext";
import { FaDumbbell, FaCheckCircle, FaArrowAltCircleRight, FaCalendar, FaCalendarAlt, FaTrash, FaEdit } from "react-icons/fa";
import ProgressBar from "./components/ProgressBar";
import CalendarModal from "./components/CalendarModal";

// Utility to format a date as "April 4"
const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
};

// When displaying the timestamp in your UI
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function Home() {
  const { goal, setGoal, getGoalForDate } = useGoal();
  const { logs, addLog, clearLogs, deleteLog } = useLogs();
  const { checkForAchievements } = useAchievements();
  const [logValue, setLogValue] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState("");
  const goalInputRef = useRef<HTMLInputElement>(null);

  // Determine today's date (with time stripped)
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Generate an array of past 30 days (including today)
  const daysRange = 30;
  const datesArray: Date[] = [];
  for (let i = daysRange - 1; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    datesArray.push(d);
  }

  // Selected date state (default: today)
  const [selectedDate, setSelectedDate] = useState(todayDate);

  // State for showing the calendar modal
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Reference for the date carousel container and for the "today" chip
  const carouselRef = useRef<HTMLDivElement>(null);
  const todayChipRef = useRef<HTMLButtonElement>(null);
  const [todayVisible, setTodayVisible] = useState(true);

  // IntersectionObserver to track visibility of today's chip
  useEffect(() => {
    if (!carouselRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === todayChipRef.current) {
            setTodayVisible(entry.isIntersecting);
          }
        });
      },
      { root: carouselRef.current, threshold: 0.5 }
    );
    if (todayChipRef.current) {
      observer.observe(todayChipRef.current);
    }
    return () => {
      if (todayChipRef.current) {
        observer.unobserve(todayChipRef.current);
      }
    };
  }, [carouselRef.current]);

  // Add this new useEffect to scroll to today on mount
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = carouselRef.current.scrollWidth;
    }
  }, []); // Empty dependency array means this runs once on mount

  // Handler for the wheel event: converts vertical scroll to horizontal scroll in carousel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (carouselRef.current) {
      e.preventDefault();
      carouselRef.current.scrollBy({ left: e.deltaY, behavior: "smooth" });
    }
  };

  // Handler for the Today button: resets selected date and autoscrolls so today's chip is visible
  const goToToday = () => {
    setSelectedDate(todayDate);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: carouselRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  };

  // Get logs for a given day
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
        console.error("Invalid timestamp format:", log.timestamp);
        return false;
      }
    });
  const getTotalForDay = (day: Date) =>
    getLogsForDay(day).reduce((sum, log) => sum + log.count, 0);

  // Get the goal for the selected date
  const dateSpecificGoal = getGoalForDate(selectedDate);

  // Stats for the selected day
  const totalSelected = getTotalForDay(selectedDate);
  const pushupsLeft = Math.max(dateSpecificGoal - totalSelected, 0);
  const progress = dateSpecificGoal > 0 ? totalSelected / dateSpecificGoal : 0;

  // Update tempGoal when selectedDate or dateSpecificGoal changes
  useEffect(() => {
    setTempGoal(dateSpecificGoal.toString());
  }, [selectedDate, dateSpecificGoal]);

  // Calculate streak for a given date
  const calculateStreak = (date: Date): number => {
    // Clone the date to avoid modifying the original
    let currentDate = new Date(date);
    let streak = 0;
    
    // Check if there are logs for the current date
    const hasLogsForCurrentDate = getLogsForDay(currentDate).length > 0;
    
    // If no logs for current date, return 0
    if (!hasLogsForCurrentDate) {
      return 0;
    }
    
    // Count current date as part of streak
    streak = 1;
    
    // Check previous days
    let checkDate = new Date(currentDate);
    while (true) {
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Check if there are logs for this day
      const hasLogs = getLogsForDay(checkDate).length > 0;
      
      if (hasLogs) {
        streak++;
      } else {
        // Break the loop when we find a day without logs
        break;
      }
    }
    
    return streak;
  };

  // Get current streak for selected date
  const currentStreak = calculateStreak(selectedDate);

  // Handler for logging pushups
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logValue || parseInt(logValue) <= 0) return;

    // Use current date and time instead of just the selected date
    const now = new Date();
    
    // If using a selected date, preserve the date but use current time
    const logDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
    
    addLog(parseInt(logValue), logDate, checkForAchievements);
    setLogValue("");
  };

  // Handler for updating the goal
  const handleGoalUpdate = () => {
    const newGoal = parseInt(tempGoal);
    if (!isNaN(newGoal) && newGoal >= 0) {
      setGoal(newGoal, selectedDate);
    } else {
      // Reset to the original value if invalid
      setTempGoal(dateSpecificGoal.toString());
    }
    setIsEditingGoal(false);
  };

  // Handle click outside to save goal
  useEffect(() => {
    if (isEditingGoal) {
      const handleClickOutside = (e: MouseEvent) => {
        if (goalInputRef.current && !goalInputRef.current.contains(e.target as Node)) {
          handleGoalUpdate();
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditingGoal, tempGoal, dateSpecificGoal]);
  
  // Handle key press for goal input
  const handleGoalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoalUpdate();
    } else if (e.key === 'Escape') {
      setIsEditingGoal(false);
      setTempGoal(dateSpecificGoal.toString());
    }
  };

  // Add state for tooltip visibility
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 overflow-x-hidden">
      <style jsx>{`
        /* Hide scrollbar for Webkit browsers */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for Firefox */
        .scrollbar-hide {
          scrollbar-width: none;
        }
      `}</style>

      {/* Date Carousel Section */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Select Date</h2>
          <button
            onClick={() => setShowCalendarModal(true)}
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            <FaCalendarAlt />
          </button>
        </div>
        <div
          className="relative py-4"
          style={{ paddingTop: "calc(1rem)", paddingBottom: "calc(1rem)" }}
        >
          <div
            ref={carouselRef}
            onWheel={handleWheel}
            style={{ overflowX: "auto", overflowY: "visible" }}
            className="flex space-x-2 scrollbar-hide px-6 py-2"
          >
            {datesArray.map((date, idx) => {
              const isSelected = date.getTime() === selectedDate.getTime();
              return (
                <button
                  key={idx}
                  id={`chip-${date.getTime()}`}
                  ref={date.getTime() === todayDate.getTime() ? todayChipRef : null}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    flex-shrink-0 
                    px-4 py-2 
                    rounded-full 
                    border 
                    origin-center 
                    transition 
                    transform 
                    hover:scale-102 
                    ${isSelected ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 text-gray-700 border-gray-300"}
                  `}
                >
                  {formatDate(date)}
                </button>
              );
            })}
          </div>
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10"
            style={{ background: "linear-gradient(to right, white, transparent)" }}
          ></div>
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10"
            style={{ background: "linear-gradient(to left, white, transparent)" }}
          ></div>
          {!todayVisible && (
            <button
              onClick={goToToday}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-blue-500 text-white p-3 rounded-full shadow hover:shadow-lg transition z-20 text-xl"
            >
              <FaArrowAltCircleRight />
            </button>
          )}
        </div>
      </div>

      {/* Log Card for Selected Date */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4 relative">
        {/* Streak Counter - only show when streak > 1 */}
        {currentStreak > 1 && (
          <div 
            className="absolute top-4 right-4 flex items-center bg-orange-100 px-3 py-1 rounded-full cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span role="img" aria-label="fire" className="mr-1">🔥</span>
            <span className="font-semibold text-orange-600">{currentStreak}</span>
            
            {/* Custom Tooltip */}
            {showTooltip && (
              <div className="absolute right-0 top-full mt-2 bg-white text-gray-800 text-sm py-2 px-3 rounded shadow-lg z-50 whitespace-nowrap border border-gray-200">
                <div className="absolute right-3 -top-2 w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-200"></div>
                <span>{currentStreak} day streak! Keep going!</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center">
          <h3 className="text-xl font-semibold flex items-center">
            {formatDate(selectedDate)}
            <span className="ml-2">-</span>
            {isEditingGoal ? (
              <input
                ref={goalInputRef}
                type="number"
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                onKeyDown={handleGoalKeyDown}
                className="ml-2 w-16 text-blue-500 font-semibold text-xl border-b border-blue-300 focus:outline-none bg-transparent"
                min="0"
                autoFocus
              />
            ) : (
              <span 
                className="ml-2 text-blue-500 font-semibold cursor-pointer" 
                onClick={() => setIsEditingGoal(true)}
              >
                {dateSpecificGoal}
              </span>
            )}
            <span className="ml-1">Pushups</span>
          </h3>
        </div>
        
        <p className="text-gray-600">
          Pushups left for today: <span className="font-bold">{pushupsLeft}</span>
        </p>
        <ProgressBar progress={progress} />
        {pushupsLeft === 0 && totalSelected > 0 && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded flex items-center">
            <FaCheckCircle className="text-green-600 mr-2" />
            <span className="text-green-800 font-semibold">
              Great job! You reached your daily goal!
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center mt-4">
          <input
            type="number"
            value={logValue}
            onChange={(e) => setLogValue(e.target.value)}
            placeholder="Enter pushups done"
            className="border border-gray-300 rounded-l p-2 w-full focus:outline-none focus:border-blue-500 shadow-md"
            min="1"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-r border border-blue-500 hover:bg-blue-600 hover:border-blue-600 transition shadow-md"
          >
            Log
          </button>
        </form>
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold mb-2">Today's Logs</h4>
          <div className="max-h-48 overflow-y-auto px-2">
            <ul className="space-y-2">
              {getLogsForDay(selectedDate).length > 0 ? (
                getLogsForDay(selectedDate).map((log, i) => (
                  <li key={i} className="flex items-center text-gray-700 pl-2 pr-4">
                    <FaDumbbell className="mr-2 text-blue-500" />
                    <span className="flex-grow">{log.count} pushups</span>
                    <span className="text-xs text-gray-500 mr-3">
                      {formatTime(log.timestamp)}
                    </span>
                    <button 
                      onClick={() => deleteLog(log.id)} 
                      className="text-red-400 hover:text-red-600 transition-colors"
                      aria-label="Delete log"
                    >
                      <FaTrash size={14} />
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm pl-2">No logs yet.</li>
              )}
            </ul>
          </div>
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Clear All Logs
            </button>
          )}
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendarModal && (
        <CalendarModal
          onClose={() => setShowCalendarModal(false)}
          onSelectDate={(date: Date) => {
            setSelectedDate(date);
            setShowCalendarModal(false);
            setTimeout(() => {
              const chip = document.getElementById(`chip-${date.getTime()}`);
              chip?.scrollIntoView({ behavior: "smooth", inline: "center" });
            }, 100);
          }}
          pushupData={logs.reduce((acc, log) => {
            const dateString = new Date(log.timestamp).toISOString().split('T')[0];
            
            const existingEntry = acc.find(item => item.date === dateString);
            
            if (existingEntry) {
              existingEntry.count += log.count;
            } else {
              acc.push({ date: dateString, count: log.count });
            }
            
            return acc;
          }, [] as Array<{date: string, count: number}>)}
        />
      )}
    </div>
  );
}
