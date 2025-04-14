"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGoal } from "./context/GoalContext";
import { useLogs } from "./context/LogContext";
import { useAchievements } from "./context/AchievementContext";
import { useAuth } from "./context/AuthContext";
import { FaDumbbell, FaCheckCircle, FaArrowAltCircleRight, FaCalendar, FaCalendarAlt, FaTrash, FaEdit } from "react-icons/fa";
import ProgressBar from "./components/ProgressBar";
import CalendarModal from "./components/CalendarModal";
import StreakCounter from "./components/StreakCounter";
import LogsSection from "./components/LogsSection";
import { formatDate } from "./utils/dateUtils";
import { useToast } from "./context/ToastContext";
import confetti from 'canvas-confetti';

// Utility to format a date as "April 4"
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function Home() {
  // Auth and router hooks
  const router = useRouter();
  const { user, loading } = useAuth();

  // Context hooks
  const { goal, setGoal, getGoalForDate } = useGoal();
  const { logs, addLog, clearLogs, deleteLog, deleteDateLogs } = useLogs();
  const { checkForAchievements, validateAchievements, achievements, allBadges } = useAchievements();
  const { showToast } = useToast();

  // State hooks
  const [logValue, setLogValue] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState("");
  const [dateSpecificGoal, setDateSpecificGoal] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [todayVisible, setTodayVisible] = useState(true);

  // Ref hooks
  const goalInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const todayChipRef = useRef<HTMLButtonElement>(null);

  // Local state to track achievements for comparison
  const [prevAchievements, setPrevAchievements] = useState<string[]>([]);
  const initialLoadRef = useRef(true);
  
  // Update prevAchievements whenever achievements change
  useEffect(() => {
    if (achievements && achievements.length > 0) {
      const earnedIds = achievements
        .filter(a => a.earned)
        .map(a => a.id);
      
      // Just update our tracking state, don't show notifications
      // since AchievementContext already handles that
      setPrevAchievements(earnedIds);
    }
  }, [achievements]);

  // Check authentication on initial load
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

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

  // Scroll to today on mount and ensure it's selected
  useEffect(() => {
    if (carouselRef.current) {
      // Scroll to the end where today's date is
      carouselRef.current.scrollLeft = carouselRef.current.scrollWidth;
      
      // Ensure today's date is selected
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      setSelectedDate(todayDate);
    }
  }, [carouselRef.current]);

  // Get today's date without time
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  
  // Generate array of dates for the carousel (last 30 days + today)
  const datesArray = [...Array(31)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 30 + i);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  
  // Update dateSpecificGoal when selectedDate changes
  useEffect(() => {
    const goal = getGoalForDate(selectedDate);
    setDateSpecificGoal(goal);
    setTempGoal(goal.toString());
  }, [selectedDate, getGoalForDate]);
  
  // Listen for goals changed event
  useEffect(() => {
    const handleGoalsChanged = () => {
      // Update the dateSpecificGoal for the currently selected date
      const updatedGoal = getGoalForDate(selectedDate);
      setDateSpecificGoal(updatedGoal);
      setTempGoal(updatedGoal.toString());
    };
    
    window.addEventListener('goalsChanged', handleGoalsChanged);
    
    return () => {
      window.removeEventListener('goalsChanged', handleGoalsChanged);
    };
  }, [selectedDate, getGoalForDate]);
  
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
  }, [isEditingGoal, tempGoal]);
  
  // Wheel event handler for carousel
  const handleWheel = (e: React.WheelEvent) => {
    if (carouselRef.current) {
      e.preventDefault();
      carouselRef.current.scrollLeft += e.deltaY;
    }
  };
  
  // Function to scroll to today's date
  const goToToday = () => {
    todayChipRef.current?.scrollIntoView({ behavior: "smooth", inline: "center" });
    setSelectedDate(todayDate);
  };
  
  // Helper function to get logs for a specific day
  const getLogsForDay = (date: Date) => {
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999
    );
    
    return logs.filter(
      (log) =>
        new Date(log.timestamp) >= startOfDay &&
        new Date(log.timestamp) <= endOfDay
    );
  };
  
  // Helper function to get total pushups for a day
  const getTotalForDay = (day: Date) =>
    getLogsForDay(day).reduce((sum, log) => sum + log.count, 0);
  
  // Stats for the selected day
  const totalSelected = getTotalForDay(selectedDate);
  const pushupsLeft = Math.max(0, dateSpecificGoal - totalSelected);
  const progress = dateSpecificGoal > 0 ? Math.min(100, (totalSelected / dateSpecificGoal) * 100) : 0;
  
  // Calculate streak for a given date
  const calculateStreak = (date: Date): number => {
    let currentDate = new Date(date);
    let streak = 0;
    
    const hasLogsForCurrentDate = getLogsForDay(currentDate).length > 0;
    if (!hasLogsForCurrentDate) {
      return 0;
    }
    
    streak = 1;
    let checkDate = new Date(currentDate);
    
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const hasLogs = getLogsForDay(checkDate).length > 0;
      
      if (hasLogs) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Get current streak for selected date
  const currentStreak = calculateStreak(selectedDate);

  // Handler for logging pushups
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logValue || parseInt(logValue) <= 0) return;

    const now = new Date();
    const logDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
    
    await addLog(parseInt(logValue), logDate.toISOString());
    setLogValue("");
  };

  // Handler for updating the goal
  const handleGoalUpdate = async () => {
    const newGoal = parseInt(tempGoal);
    if (!isNaN(newGoal) && newGoal >= 0) {
      setGoal(newGoal, selectedDate);
      setDateSpecificGoal(newGoal); // Update local state immediately for UI responsiveness
      // The goalsChanged event will handle updating the goal in other components
    } else {
      setTempGoal(dateSpecificGoal.toString());
    }
    setIsEditingGoal(false);
  };
  
  // Handle key press for goal input
  const handleGoalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoalUpdate();
    } else if (e.key === 'Escape') {
      setIsEditingGoal(false);
      setTempGoal(dateSpecificGoal.toString());
    }
  };

  // If still loading or not authenticated, show nothing
  if (loading || !user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 overflow-x-hidden bg-white dark:bg-gray-900">
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Date</h2>
          <button
            onClick={() => setShowCalendarModal(true)}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
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
                    ${isSelected 
                      ? "bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600" 
                      : "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"}
                  `}
                >
                  {formatDate(date)}
                </button>
              );
            })}
          </div>
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-white to-transparent dark:from-gray-900 dark:to-transparent"
          ></div>
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-white to-transparent dark:from-gray-900 dark:to-transparent"
          ></div>
          {!todayVisible && (
            <button
              onClick={goToToday}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-blue-500 text-white p-3 rounded-full shadow hover:shadow-lg transition z-20 text-xl dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <FaArrowAltCircleRight />
            </button>
          )}
        </div>
      </div>

      {/* Log Card for Selected Date */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4 relative">
        {/* Streak Counter Component */}
        <StreakCounter streak={currentStreak} />

        <div className="flex items-center">
          <h3 className="text-xl font-semibold flex items-center text-gray-900 dark:text-white">
            {formatDate(selectedDate)}
            <span className="ml-2">-</span>
            {isEditingGoal ? (
              <input
                ref={goalInputRef}
                type="number"
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                onKeyDown={handleGoalKeyDown}
                className="ml-2 w-16 text-blue-500 font-semibold text-xl border-b border-blue-300 focus:outline-none bg-transparent dark:text-blue-400 dark:border-blue-500"
                min="0"
                autoFocus
              />
            ) : (
              <span 
                className="ml-2 text-blue-500 font-semibold cursor-pointer dark:text-blue-400" 
                onClick={() => setIsEditingGoal(true)}
              >
                {dateSpecificGoal}
              </span>
            )}
            <span className="ml-1">Pushups</span>
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300">
          Pushups left for today: <span className="font-bold">{pushupsLeft}</span>
        </p>
        <ProgressBar progress={progress} />
        {pushupsLeft === 0 && totalSelected > 0 && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded flex items-center dark:bg-green-900 dark:border-green-700">
            <FaCheckCircle className="text-green-600 mr-2 dark:text-green-400" />
            <span className="text-green-800 font-semibold dark:text-green-200">
              {totalSelected > dateSpecificGoal 
                ? `🌟 Superstar! You've exceeded your goal by ${totalSelected - dateSpecificGoal} ${totalSelected - dateSpecificGoal === 1 ? 'pushup' : 'pushups'}!`
                : "Great job! You reached your daily goal!"}
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center mt-4">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={logValue}
            onChange={(e) => setLogValue(e.target.value)}
            placeholder="Enter pushups done"
            className="border border-gray-300 rounded-l p-2 w-full focus:outline-none focus:border-blue-500 shadow-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            min="1"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-r border border-blue-500 hover:bg-blue-600 hover:border-blue-600 transition shadow-md dark:bg-blue-600 dark:border-blue-600 dark:hover:bg-blue-700 dark:hover:border-blue-700"
          >
            Log
          </button>
        </form>
        
        <LogsSection
          logs={logs}
          selectedDate={selectedDate}
          getLogsForDay={getLogsForDay}
          deleteLog={deleteLog}
          clearLogs={clearLogs}
          deleteDateLogs={deleteDateLogs}
        />
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
            try {
              // Create a date object from the log timestamp
              const logDate = new Date(log.timestamp);
              
              // Format the date as YYYY-MM-DD, using local timezone
              const year = logDate.getFullYear();
              const month = String(logDate.getMonth() + 1).padStart(2, '0');
              const day = String(logDate.getDate()).padStart(2, '0');
              const dateString = `${year}-${month}-${day}`;
              
              // Find or create entry
              const existingEntry = acc.find(item => item.date === dateString);
              
              if (existingEntry) {
                existingEntry.count += log.count;
              } else {
                acc.push({ date: dateString, count: log.count });
              }
            } catch (e) {
              console.error("Invalid timestamp format:", log.timestamp);
            }
            
            return acc;
          }, [] as Array<{date: string, count: number}>)}
          logs={logs}
        />
      )}
    </div>
  );
}
