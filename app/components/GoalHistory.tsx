import { useState, useEffect, useRef } from 'react';
import { useGoal } from '../context/GoalContext';
import { format } from 'date-fns';

type EditingState = {
  index: number;
  value: string;
} | null;

export default function GoalHistory() {
  const { goalHistory, setGoal } = useGoal();
  const [history, setHistory] = useState<any[]>([]);
  const [editing, setEditing] = useState<EditingState>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (goalHistory && goalHistory.length > 0) {
      // Sort history by date and changed_at
      const sortedHistory = [...goalHistory].sort((a, b) => {
        // First sort by date
        const dateCompare = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        // If dates are equal, sort by changed_at
        if (a.changedAt && b.changedAt) {
          return new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime();
        }
        return 0;
      });
      
      setHistory(sortedHistory);
    }
  }, [goalHistory]);

  // Handle click outside to save goal
  useEffect(() => {
    if (editing) {
      const handleClickOutside = (e: MouseEvent) => {
        if (editInputRef.current && !editInputRef.current.contains(e.target as Node)) {
          handleSaveEdit();
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editing]);

  const handleStartEdit = (index: number, currentValue: number) => {
    setEditing({
      index,
      value: currentValue.toString()
    });
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 0);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    const newValue = parseInt(editing.value);
    if (!isNaN(newValue) && newValue >= 0) {
      const item = history[editing.index];
      const date = new Date(item.startDate);
      await setGoal(newValue, date);
    }
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditing(null);
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className="bg-white p-6 rounded shadow max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-4">Goal History</h2>
        <p className="text-gray-500">No goal history available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Goal History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Goal
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Changed At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(item.startDate), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editing?.index === index ? (
                    <input
                      ref={editInputRef}
                      type="number"
                      value={editing.value}
                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      onKeyDown={handleKeyDown}
                      className="w-16 text-blue-500 font-semibold text-sm border-b border-blue-300 focus:outline-none bg-transparent"
                      min="0"
                    />
                  ) : (
                    <span 
                      className="text-blue-500 font-semibold cursor-pointer hover:border-b hover:border-blue-300" 
                      onClick={() => handleStartEdit(index, item.value)}
                    >
                      {item.value}
                    </span>
                  )}
                  <span className="text-gray-900 ml-1">pushups</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.changedAt ? format(new Date(item.changedAt), 'h:mm a') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 