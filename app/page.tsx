// app/page.tsx
"use client";

import { useState, useRef } from "react";
import { useGoal } from "./context/GoalContext";
import { useLogs } from "./context/LogContext";
import { useAchievements } from "./context/AchievementContext";
import { FaDumbbell, FaCheckCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import ProgressBar from "./components/ProgressBar";

// Utility: format a date as "April 4"
const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "long", day: "numeric" });

export default function Home() {
  const { goal } = useGoal();
  const { logs, addLog, clearLogs } = useLogs();
  const { checkForAchievements } = useAchievements();
  const [logValue, setLogValue] = useState("");

  // Today's date (time stripped)
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Generate an array of the past 30 days (including today)
  const daysRange = 30;
  const datesArray = [];
  for (let i = daysRange - 1; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    datesArray.push(d);
  }

  // Selected date state (default: today)
  const [selectedDate, setSelectedDate] = useState(todayDate);

  // Reference for the date carousel container
  const carouselRef = useRef<HTMLDivElement>(null);

  // Handler to scroll the carousel when arrow buttons are clicked
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 100; // pixels to scroll per click
      carouselRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  // Handler for the Today button: reset selected date and auto-scroll to the rightmost (today)
  const handleToday = () => {
    setSelectedDate(todayDate);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: carouselRef.current.scrollWidth, behavior: "smooth" });
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

  // For the selected day
  const totalSelected = getTotalForDay(selectedDate);
  const pushupsLeft = Math.max(goal - totalSelected, 0);
  const progress = goal > 0 ? totalSelected / goal : 0;

  // Handler for logging pushups using the selected day's date
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Date Carousel Section */}
      <div>
        {/* Header aligned with the log card */}
        <h2 className="text-2xl font-bold mb-4 ml-6">Select Date</h2>
        <div className="relative">
          {/* Fade overlays on left and right edges */}
          <div className="absolute left-0 top-0 bottom-0 w-10 pointer-events-none bg-gradient-to-r from-white to-transparent"></div>
          <div className="absolute right-0 top-0 bottom-0 w-10 pointer-events-none bg-gradient-to-l from-white to-transparent"></div>

          {/* Left arrow button placed outside the carousel */}
          <button
            onClick={() => scrollCarousel("left")}
            className="absolute left-[-50px] top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow hover:shadow-lg transition"
          >
            <FaArrowLeft />
          </button>

          {/* Date carousel container with extra vertical padding */}
          <div ref={carouselRef} className="flex space-x-4 overflow-x-auto scrollbar-hide py-4 px-12">
            {datesArray.map((date, idx) => {
              const isSelected = date.getTime() === selectedDate.getTime();
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full border transition transform hover:scale-105 ${
                    isSelected
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                >
                  {formatDate(date)}
                </button>
              );
            })}
          </div>

          {/* Right arrow button placed outside the carousel */}
          <button
            onClick={() => scrollCarousel("right")}
            className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow hover:shadow-lg transition"
          >
            <FaArrowRight />
          </button>

          {/* Today button (blue arrow) when selected date isn't today */}
          {selectedDate.getTime() !== todayDate.getTime() && (
            <button
              onClick={handleToday}
              className="absolute right-[-100px] top-1/2 transform -translate-y-1/2 bg-blue-500 p-3 rounded-full shadow hover:shadow-lg transition text-white"
            >
              <FaArrowRight />
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
            <span className="text-green-800 font-semibold">Great job! You reached your daily goal!</span>
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
          <button type="submit" className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600 transition">
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
