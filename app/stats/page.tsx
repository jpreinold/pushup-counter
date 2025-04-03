"use client";

import { useState } from "react";
import { useLogs } from "../context/LogContext";
import { useAchievements } from "../context/AchievementContext";
import { usePrestige } from "../context/PrestigeContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function StatsPage() {
  const { logs, clearLogs } = useLogs();
  const { unlocked, allBadges } = useAchievements();
  const { prestige } = usePrestige();
  const [range, setRange] = useState("week");

  const now = new Date();
  let startDate: Date;
  switch (range) {
    case "day":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      break;
    case "year":
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case "all":
    default:
      startDate = new Date(0);
      break;
  }

  const filteredLogs = logs.filter((log) => log.timestamp >= startDate);
  const grouped: { [key: string]: number } = {};
  filteredLogs.forEach((log) => {
    const dateKey = log.timestamp.toISOString().split("T")[0];
    grouped[dateKey] = (grouped[dateKey] || 0) + log.count;
  });

  const sortedDates = Object.keys(grouped).sort();
  const chartData = {
    labels: sortedDates,
    datasets: [
      {
        label: "Pushups",
        data: sortedDates.map((date) => grouped[date]),
        fill: false,
        tension: 0.1,
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: `Pushup Stats (${range})` },
    },
    scales: {
      x: { ticks: { color: "#4b5563" }, grid: { color: "#e5e7eb" } },
      y: { ticks: { color: "#4b5563" }, grid: { color: "#e5e7eb" } },
    },
  };

  const handleReset = () => {
    localStorage.removeItem("unlockedBadges");
    localStorage.removeItem("prestigeLevel");
    clearLogs();
    window.location.reload();
  };

  const currentPrestigeBadges = allBadges.filter((badge) => badge.rank === prestige);

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Pushup Stats</h2>
      <p className="mb-4 text-gray-600">
        Current Prestige Level: <span className="font-bold">{prestige}</span>
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="font-medium">Select Range:</label>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="border p-4 rounded mb-8">
        {sortedDates.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <p className="text-center text-gray-500">
            No data available for the selected range.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold mb-2">🏅 Prestige {prestige} Achievements</h3>
        <div className="flex flex-wrap gap-4 mb-10">
          {currentPrestigeBadges.map((badge) => (
            <div
              key={badge.id}
              className={`
                p-4 rounded shadow w-40 text-center border transform transition-all duration-200 ease-in-out
                hover:scale-105 hover:shadow-xl
                ${unlocked.includes(badge.id)
                  ? "bg-green-100 border-green-400"
                  : "bg-gray-100 border-gray-300 opacity-50"}
              `}
            >
              <div className="text-3xl mb-1">{badge.emoji}</div>
              <div className="font-semibold">{badge.name}</div>
              <p className="text-sm text-gray-600">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <button
          onClick={handleReset}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          🔄 Reset Prestige & Badges
        </button>
        <p className="text-sm text-gray-500 mt-1">
          This will wipe your current prestige level and all unlocked badges.
        </p>
      </div>
    </div>
  );
}
