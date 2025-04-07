"use client";

import { useState, useEffect } from "react";
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
  TimeScale,
  ScatterController,
} from "chart.js";
import { Line, Scatter } from "react-chartjs-2";
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  TimeScale,
  ScatterController
);

export default function StatsPage() {
  const { logs, clearLogs } = useLogs();
  const { unlocked, allBadges, validateAchievements, checkForAchievements } = useAchievements();
  const { prestige } = usePrestige();
  const [range, setRange] = useState("week");

  // Validate achievements when the page loads
  useEffect(() => {
    validateAchievements();
    checkForAchievements();
  }, [validateAchievements, checkForAchievements]);

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

  const filteredLogs = logs.filter((log) => new Date(log.timestamp) >= startDate);
  
  // Special handling for day view to show individual log points
  if (range === "day") {
    // Create data points for scatter plot
    const dataPoints = filteredLogs.map(log => {
      const logDate = new Date(log.timestamp);
      // Convert to decimal hours for x-axis (e.g., 1:30 PM = 13.5)
      const hours = logDate.getHours();
      const minutes = logDate.getMinutes();
      const decimalHours = hours + (minutes / 60);
      
      return {
        x: decimalHours,
        y: log.count
      };
    });
    
    const chartData = {
      datasets: [
        {
          label: "Pushups",
          data: dataPoints,
          backgroundColor: "#3b82f6",
          pointRadius: 8,
          pointHoverRadius: 10,
        },
      ],
    };
    
    const options = {
      responsive: true,
      plugins: {
        legend: { 
          display: false
        },
        title: { 
          display: true, 
          text: `Pushup Stats (Today)`,
          font: {
            family: "'Inter', sans-serif",
            size: 16,
            weight: 'bold'
          },
          color: "#000000"
        },
        tooltip: {
          callbacks: {
            title: function(context: any) {
              const hour = Math.floor(context[0].parsed.x);
              const minute = Math.round((context[0].parsed.x - hour) * 60);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
            },
            label: function(context: any) {
              return `${context.parsed.y} pushups`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            family: "'Inter', sans-serif",
            size: 14
          },
          bodyFont: {
            family: "'Inter', sans-serif",
            size: 13
          },
          padding: 10,
          cornerRadius: 6
        }
      },
      scales: {
        x: { 
          title: {
            display: true,
            text: 'Time',
            font: {
              family: "'Inter', sans-serif",
              size: 14,
              color: "#000000"
            },
            color: "#000000"
          },
          min: 0,
          max: 24,
          ticks: { 
            color: "#000000",
            font: {
              family: "'Inter', sans-serif",
              size: 12
            },
            callback: function(value: number) {
              const hour = value % 12 || 12;
              const ampm = value >= 12 ? 'PM' : 'AM';
              return `${hour} ${ampm}`;
            },
            stepSize: 2
          }, 
          grid: { color: "#e5e7eb" } 
        },
        y: { 
          title: {
            display: true,
            text: 'Pushups',
            font: {
              family: "'Inter', sans-serif",
              size: 14
            },
            color: "#000000"
          },
          beginAtZero: true,
          ticks: { 
            color: "#000000",
            font: {
              family: "'Inter', sans-serif",
              size: 12
            }
          }, 
          grid: { color: "#e5e7eb" } 
        },
      },
    };
    
    return renderPage(chartData, options, true);
  } else {
    // Original code for other time ranges
    const grouped: { [key: string]: number } = {};
    filteredLogs.forEach((log) => {
      const dateKey = log.timestamp.split("T")[0];
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
        legend: { 
          display: false
        },
        title: { 
          display: true, 
          text: `Pushup Stats (${range})`,
          font: {
            family: "'Inter', sans-serif",
            size: 16,
            weight: 'bold'
          },
          color: "#000000"
        },
        tooltip: {
          callbacks: {
            title: function(context: any) {
              const date = new Date(context[0].label);
              return format(date, 'MMM d, yyyy');
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            family: "'Inter', sans-serif",
            size: 14
          },
          bodyFont: {
            family: "'Inter', sans-serif",
            size: 13
          },
          padding: 10,
          cornerRadius: 6
        }
      },
      scales: {
        x: { 
          title: {
            display: true,
            text: 'Date',
            font: {
              family: "'Inter', sans-serif",
              size: 14
            },
            color: "#000000"
          },
          ticks: { 
            color: "#000000",
            font: {
              family: "'Inter', sans-serif",
              size: 12
            },
            callback: function(value: any, index: number, values: any) {
              const date = new Date(sortedDates[index]);
              return format(date, 'MMM d');
            }
          }, 
          grid: { color: "#e5e7eb" } 
        },
        y: { 
          title: {
            display: true,
            text: 'Pushups',
            font: {
              family: "'Inter', sans-serif",
              size: 14
            },
            color: "#000000"
          },
          beginAtZero: true,
          ticks: { 
            color: "#000000",
            font: {
              family: "'Inter', sans-serif",
              size: 12
            }
          }, 
          grid: { color: "#e5e7eb" } 
        },
      },
    };
    
    return renderPage(chartData, options, false);
  }
  
  function renderPage(chartData: any, options: any, isScatter: boolean) {
    const handleReset = () => {
      // Clear all achievement-related localStorage items
      localStorage.removeItem("achievements");
      localStorage.removeItem("prestigeLevel");
      
      // Clear logs
      clearLogs();
      
      // Force validation after clearing logs
      setTimeout(() => {
        validateAchievements();
        checkForAchievements();
      }, 100);
      
      // Force reload to update all contexts
      window.location.reload();
    };

    const currentPrestigeBadges = allBadges.filter((badge) => badge.rank === prestige);

    return (
      <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Pushup Stats</h2>
        <p className="mb-4 text-gray-600">
          Current Prestige Level: <span className="font-bold">{prestige}</span>
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="font-medium text-gray-700">Select Range:</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="p-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="day">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="border border-gray-200 rounded-xl p-6 mb-8 bg-white shadow-lg relative">
          {(isScatter ? chartData.datasets[0].data.length > 0 : chartData.labels.length > 0) ? (
            isScatter ? (
              <Scatter data={chartData} options={options} />
            ) : (
              <Line data={chartData} options={options} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-center text-gray-500 mb-2">
                No data available for the selected range.
              </p>
              <p className="text-center text-gray-400 text-sm">
                Log some pushups to see your stats!
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">🏅 Prestige {prestige} Achievements</h3>
          <div className="flex flex-wrap gap-4 mb-10">
            {currentPrestigeBadges.map((badge) => (
              <div
                key={badge.id}
                className={`
                  p-4 rounded-lg shadow-md w-40 text-center border transform transition-all duration-200 ease-in-out
                  hover:scale-105 hover:shadow-xl
                  ${unlocked.includes(badge.id)
                    ? "bg-gradient-to-br from-green-50 to-green-100 border-green-400"
                    : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-60"}
                `}
              >
                <div className="text-3xl mb-2">{badge.emoji}</div>
                <div className="font-semibold mb-1">{badge.name}</div>
                <p className="text-sm text-gray-600">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
