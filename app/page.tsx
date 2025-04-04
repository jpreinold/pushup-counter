"use client";

import { useState, useRef, useEffect } from "react";
import { useGoal } from "./context/GoalContext";
import { useLogs } from "./context/LogContext";
import { useAchievements } from "./context/AchievementContext";
import { FaDumbbell, FaCheckCircle, FaArrowAltCircleRight } from "react-icons/fa";
import ProgressBar from "./components/ProgressBar";

// Utility to format a date as "April 4"
const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
};

export default function Home() {
  const { goal } = useGoal();
  const { logs, addLog, clearLogs } = useLogs();
  const { checkForAchievements } = useAchievements();
  const [logValue, setLogValue] = useState("");

  // Determine today's date (with time stripped)
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Generate an array of past 30 days (including today)
  const daysRange = 30;
  const datesArray = [];
  for (let i = daysRange - 1; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    datesArray.push(d);
  }

  // Selected date state (default: today)
  const [selectedDate, setSelectedDate] = useState(todayDate);

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
      const logDate = new Date(log.timestamp);
      return (
        logDate.getFullYear() === day.getFullYear() &&
        logDate.getMonth() === day.getMonth() &&
        logDate.getDate() === day.getDate()
      );
    });
  const getTotalForDay = (day: Date) =>
    getLogsForDay(day).reduce((sum, log) => sum + log.count, 0);

  // Stats for the selected day
  const totalSelected = getTotalForDay(selectedDate);
  const pushupsLeft = Math.max(goal - totalSelected, 0);
  const progress = goal > 0 ? totalSelected / goal : 0;

  // Handler for logging pushups
  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(logValue);
    if (isNaN(count) || count <= 0) return;
    const now = new Date();
    const timestamp = new Date(selectedDate);
    timestamp.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    addLog(count, timestamp);
    setLogValue("");
    checkForAchievements();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4 overflow-x-hidden">
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
        {/* "Select Date" Title with smaller bottom margin */}
        <div className="px-6">
          <h3 className="text-xl font-semibold mb-1">Select Date</h3>
        </div>
        <div
          className="relative py-4"
          style={{ paddingTop: "calc(1rem + 1px)", paddingBottom: "calc(1rem + 1px)" }}
        >
          {/* Carousel container */}
          <div
            ref={carouselRef}
            onWheel={handleWheel}
            style={{ overflowX: "auto", overflowY: "visible" }}
            className="flex space-x-4 scrollbar-hide px-6"
          >
            {datesArray.map((date, idx) => {
              const isSelected = date.getTime() === selectedDate.getTime();
              return (
                <button
                  key={idx}
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

          {/* Fade overlays */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10"
            style={{ background: "linear-gradient(to right, white, transparent)" }}
          ></div>
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10"
            style={{ background: "linear-gradient(to left, white, transparent)" }}
          ></div>

          {/* Today button: appears if today's chip isn't visible */}
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
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-xl font-semibold">{formatDate(selectedDate)}</h3>
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
        <form onSubmit={handleLog} className="flex space-x-2">
          <input
            type="number"
            value={logValue}
            onChange={(e) => setLogValue(e.target.value)}
            placeholder="Enter pushups done"
            className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600 transition"
          >
            Log
          </button>
        </form>
        <div className="border-t pt-4">
          <h4 className="text-lg font-semibold mb-2">Today's Logs</h4>
          <div className="max-h-48 overflow-y-auto">
            <ul className="space-y-2">
              {getLogsForDay(selectedDate).length > 0 ? (
                getLogsForDay(selectedDate).map((log, i) => (
                  <li key={i} className="flex items-center text-gray-700">
                    <FaDumbbell className="mr-2 text-blue-500" />
                    <span>{log.count} pushups</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm">No logs yet.</li>
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
    </div>
  );
}
