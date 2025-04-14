import { useState } from 'react';
import { FaTrash, FaDumbbell, FaEdit } from 'react-icons/fa';
import { formatTime } from '../utils/dateUtils';
import { useLogs } from '../context/LogContext';
import { useGoal } from '../context/GoalContext';
import { format } from 'date-fns';

interface LogsSectionProps {
  logs: Array<{id: string, timestamp: string, count: number}>;
  selectedDate: Date;
  getLogsForDay: (date: Date) => Array<{id: string, timestamp: string, count: number}>;
  deleteLog: (id: string) => void;
  clearLogs: () => void;
  deleteDateLogs: (date: Date) => void;
}

export default function LogsSection({ 
  logs, 
  selectedDate, 
  getLogsForDay, 
  deleteLog, 
  clearLogs,
  deleteDateLogs 
}: LogsSectionProps) {
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const { logs: contextLogs } = useLogs();
  const { goalHistory } = useGoal();
  
  // Wrap deleteLog and simply call the function (achievements are handled by useEffect in parent)
  const handleDeleteLog = (id: string) => {
    deleteLog(id);
  };
  
  // Wrap deleteDateLogs and simply call the function (achievements are handled by useEffect in parent)
  const handleDeleteDateLogs = (date: Date) => {
    deleteDateLogs(date);
  };
  
  // Find the goal change for the selected date
  const getGoalChangeForDate = (date: Date) => {
    if (!goalHistory || goalHistory.length === 0) return null;
    
    // Format the date to match the format used in goalHistory
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Find the most recent goal change for this date
    const goalChanges = goalHistory.filter(entry => {
      const entryDate = new Date(entry.startDate);
      return (
        entryDate.getFullYear() === date.getFullYear() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getDate() === date.getDate()
      );
    });
    
    if (goalChanges.length === 0) return null;
    
    // Sort by changedAt to get the most recent
    goalChanges.sort((a, b) => {
      if (!a.changedAt || !b.changedAt) return 0;
      return new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime();
    });
    
    return goalChanges[0];
  };
  
  const goalChange = getGoalChangeForDate(selectedDate);
  
  return (
    <div className="border-t dark:border-gray-700 pt-6">
      <div className="flex items-center mb-2">
        <h4 className="text-lg font-semibold mr-2 text-gray-900 dark:text-white">Today's Logs</h4>
        {getLogsForDay(selectedDate).length > 0 && (
          <button
            onClick={() => setShowClearConfirmation(true)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            aria-label="Clear today's logs"
            title="Clear today's logs"
          >
            <FaTrash size={16} />
          </button>
        )}
      </div>
      
      {goalChange && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md flex items-center">
          <FaEdit className="text-blue-500 dark:text-blue-400 mr-2" />
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-200">
              Goal set to <span className="font-semibold">{goalChange.value} {goalChange.value === 1 ? 'pushup' : 'pushups'}</span>
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              at {goalChange.changedAt ? format(new Date(goalChange.changedAt), 'h:mm a') : 'N/A'}
            </span>
          </div>
        </div>
      )}
      
      <ul className="space-y-2">
        {getLogsForDay(selectedDate).length > 0 ? (
          getLogsForDay(selectedDate).map((log) => (
            <li key={log.id} className="flex items-center text-gray-700 dark:text-gray-200 pl-2 pr-4">
              <FaDumbbell className="mr-2 text-blue-500 dark:text-blue-400" />
              <span className="flex-grow">{log.count} {log.count === 1 ? 'pushup' : 'pushups'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                {formatTime(log.timestamp)}
              </span>
              <button 
                onClick={() => handleDeleteLog(log.id)}
                className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                aria-label="Delete log"
              >
                <FaTrash size={14} />
              </button>
            </li>
          ))
        ) : (
          <li className="text-gray-500 dark:text-gray-400 text-sm pl-2">No logs yet.</li>
        )}
      </ul>
      
      {/* Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/25"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowClearConfirmation(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Confirm Deletion</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to clear all logs for this date? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteDateLogs(selectedDate);
                  setShowClearConfirmation(false);
                }}
                className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 