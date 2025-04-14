"use client";

import { useState, useEffect } from "react";
import { useLogs } from "../context/LogContext";
import { useAchievements } from "../context/AchievementContext";
import { usePrestige } from "../context/PrestigeContext";
import { format } from 'date-fns';
import { FaCalendarAlt } from "react-icons/fa";
import StatsCalendarModal from "../components/StatsCalendarModal";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Bar, Scatter } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const scatterChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: '',
      color: 'rgb(17, 24, 39)',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#000',
      bodyColor: '#000',
      borderColor: '#ddd',
      borderWidth: 1,
      padding: 10,
      displayColors: false,
      callbacks: {
        label: function(context: any) {
          const point = context.raw;
          const date = new Date(point.x);
          const time = format(date, 'h:mm a');
          return `Time: ${time} - Pushups: ${point.y}`;
        }
      }
    }
  },
  scales: {
    x: {
      type: 'time' as const,
      time: {
        unit: 'hour',
        displayFormats: {
          hour: 'h:mm a'
        },
        parser: 'HH:mm',
        tooltipFormat: 'h:mm a'
      },
      min: new Date().setHours(0, 0, 0, 0),
      max: new Date().setHours(23, 59, 59, 999),
      ticks: {
        stepSize: 2,
        color: 'rgb(17, 24, 39)',
        font: {
          size: 12
        },
        callback: function(value: any) {
          return format(new Date(value), 'h:mm a');
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: 'rgb(17, 24, 39)',
        font: {
          size: 12
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    }
  }
} as const;

const barChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: '',
      color: 'rgb(17, 24, 39)',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#000',
      bodyColor: '#000',
      borderColor: '#ddd',
      borderWidth: 1,
      padding: 10,
      displayColors: false
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        color: 'rgb(17, 24, 39)',
        font: {
          size: 12
        },
        maxRotation: 45,
        minRotation: 45,
        callback: function(this: any, value: any, index: number, values: any[]): string {
          // Show every nth tick based on the number of values
          const step = Math.ceil(values.length / 7); // Aim for about 7 visible labels
          return index % step === 0 ? value : '';
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        color: 'rgb(17, 24, 39)',
        font: {
          size: 12
        }
      }
    }
  }
} as const;

export default function StatsPage() {
  const { logs, clearLogs } = useLogs();
  const { unlocked, allBadges, validateAchievements, checkForAchievements } = useAchievements();
  const { prestige } = usePrestige();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode on mount and when it changes
    const checkDarkMode = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    // Initial check
    checkDarkMode();
    
    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  // Validate achievements when the page loads
  useEffect(() => {
    validateAchievements();
    checkForAchievements();
  }, [validateAchievements, checkForAchievements]);

  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  
  if (dateRange.start) {
    // Set start date to beginning of day
    startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0);
    
    // Set end date to end of day
    endDate = new Date(dateRange.end || dateRange.start);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Default to last 7 days if no date is selected
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
  }

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    // Set time to start of day for startDate and end of day for endDate
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return logDate >= start && logDate <= end;
  });

  const prepareChartData = () => {
    const getChartOptions = (baseOptions: any) => {
      const options = JSON.parse(JSON.stringify(baseOptions));
      
      if (isDarkMode) {
        options.plugins.title.color = 'rgb(255, 255, 255)';
        options.scales.x.ticks.color = 'rgb(255, 255, 255)';
        options.scales.y.ticks.color = 'rgb(255, 255, 255)';
        options.scales.x.grid.color = 'rgba(255, 255, 255, 0.1)';
        options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
      } else {
        options.plugins.title.color = 'rgb(17, 24, 39)';
        options.scales.x.ticks.color = 'rgb(17, 24, 39)';
        options.scales.y.ticks.color = 'rgb(17, 24, 39)';
        options.scales.x.grid.color = 'rgba(0, 0, 0, 0.1)';
        options.scales.y.grid.color = 'rgba(0, 0, 0, 0.1)';
      }
      
      return options;
    };

    if (!dateRange.start) {
      // Default 7-day view
      const grouped: { [key: string]: number } = {};
      filteredLogs.forEach((log) => {
        const dateKey = log.timestamp.split("T")[0];
        grouped[dateKey] = (grouped[dateKey] || 0) + log.count;
      });

      // Add all dates in the range, even if they have 0 pushups
      const sortedDates = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split("T")[0];
        sortedDates.push(dateKey);
        if (!grouped[dateKey]) {
          grouped[dateKey] = 0;
        }
      }

      const options = getChartOptions(barChartOptions);
      options.plugins.title.text = `Pushups from ${format(startDate, 'MMMM d, yyyy')} to ${format(endDate, 'MMMM d, yyyy')}`;

      return {
        type: 'bar' as const,
        data: {
          labels: sortedDates.map(date => format(new Date(date), 'MMM d')),
          datasets: [{
            label: 'Pushups',
            data: sortedDates.map(date => grouped[date]),
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            borderWidth: 1,
          }]
        },
        options
      };
    } else if (dateRange.start && dateRange.end && dateRange.start.getTime() === dateRange.end.getTime()) {
      // Single day view - scatter plot
      const dataPoints = filteredLogs.map(log => {
        const logDate = new Date(log.timestamp);
        const hours = logDate.getHours();
        const minutes = logDate.getMinutes();
        const date = new Date(logDate);
        date.setHours(hours, minutes, 0, 0);
        
        return {
          x: date,
          y: log.count
        };
      });

      const options = getChartOptions(scatterChartOptions);
      options.plugins.title.text = `Pushups on ${format(dateRange.start, 'MMMM d, yyyy')}`;

      return {
        type: 'scatter' as const,
        data: {
          datasets: [{
            label: 'Pushups',
            data: dataPoints,
            backgroundColor: '#3b82f6',
            pointRadius: 8,
            pointHoverRadius: 10,
          }]
        },
        options
      };
    } else {
      // Date range view - bar chart
      const grouped: { [key: string]: number } = {};
      filteredLogs.forEach((log) => {
        const dateKey = log.timestamp.split("T")[0];
        grouped[dateKey] = (grouped[dateKey] || 0) + log.count;
      });

      // Add all dates in the range, even if they have 0 pushups
      const sortedDates = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDate <= endDateObj) {
        const dateKey = currentDate.toISOString().split("T")[0];
        sortedDates.push(dateKey);
        if (!grouped[dateKey]) {
          grouped[dateKey] = 0;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const options = getChartOptions(barChartOptions);
      options.plugins.title.text = `Pushups from ${format(startDate, 'MMMM d, yyyy')} to ${format(endDate, 'MMMM d, yyyy')}`;

      return {
        type: 'bar' as const,
        data: {
          labels: sortedDates.map(date => format(new Date(date), 'MMM d')),
          datasets: [{
            label: 'Pushups',
            data: sortedDates.map(date => grouped[date]),
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            borderWidth: 1,
          }]
        },
        options
      };
    }
  };

  const chartData = prepareChartData();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Pushup Stats</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        Current Prestige Level: <span className="font-bold">{prestige}</span>
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="font-medium text-gray-700 dark:text-gray-300">Select Date Range:</label>
        <button
          onClick={() => setShowCalendarModal(true)}
          className="p-2.5 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <FaCalendarAlt />
        </button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8 bg-white dark:bg-gray-800 shadow-lg relative">
        {chartData.data.datasets[0].data.length > 0 ? (
          chartData.type === 'scatter' ? (
            <Scatter data={chartData.data} options={chartData.options} />
          ) : (
            <Bar data={chartData.data} options={chartData.options} />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-gray-500 dark:text-gray-400 mb-2">
              No data available for the selected date range.
            </p>
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm">
              Log some pushups to see your stats!
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">🏅 Prestige {prestige} Achievements</h3>
        <div className="flex flex-wrap gap-4 mb-10">
          {allBadges.filter((badge) => badge.rank === prestige).map((badge) => (
            <div
              key={badge.id}
              className={`
                p-4 rounded-lg shadow-md w-40 text-center border transform transition-all duration-200 ease-in-out
                hover:scale-105 hover:shadow-xl
                ${unlocked.includes(badge.id)
                  ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-400 dark:border-green-500"
                  : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-gray-300 dark:border-gray-600 opacity-60"}
              `}
            >
              <div className="text-3xl mb-2">{badge.emoji}</div>
              <div className="font-semibold mb-1 text-gray-900 dark:text-white">{badge.name}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>

      {showCalendarModal && (
        <StatsCalendarModal
          onClose={() => setShowCalendarModal(false)}
          onSelectDate={(start, end) => {
            setDateRange({ start, end });
            setShowCalendarModal(false);
          }}
          pushupData={logs.reduce((acc, log) => {
            try {
              const logDate = new Date(log.timestamp);
              const year = logDate.getFullYear();
              const month = String(logDate.getMonth() + 1).padStart(2, '0');
              const day = String(logDate.getDate()).padStart(2, '0');
              const dateString = `${year}-${month}-${day}`;
              
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
