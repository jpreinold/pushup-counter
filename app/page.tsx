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

  // Update tempGoal when selectedDate or dateSpecificGoal changes
  useEffect(() => {
    const dateSpecificGoal = getGoalForDate(selectedDate);
    setTempGoal(dateSpecificGoal.toString());
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

  // If still loading or not authenticated, show nothing
  if (loading || !user) {
    return null;
  }

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

  // Handler for the wheel event
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (carouselRef.current) {
      e.preventDefault();
      carouselRef.current.scrollBy({ left: e.deltaY, behavior: "smooth" });
    }
  };

  // Handler for the Today button
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
      // Direct check will be handled by the useEffect dependency on goal
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
        {/* Streak Counter Component */}
        <StreakCounter streak={currentStreak} />

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
            inputMode="numeric"
            pattern="[0-9]*"
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
