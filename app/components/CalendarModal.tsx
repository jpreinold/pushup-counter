import { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaDumbbell } from "react-icons/fa";

interface PushupData {
  date: string;
  count: number;
}

interface CalendarModalProps {
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  pushupData?: PushupData[];
}

export default function CalendarModal({ onClose, onSelectDate, pushupData = [] }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Debug log
  console.log("Calendar pushup data:", pushupData);
  
  // Get first day of month and total days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Create calendar grid
  const days = [];
  const startDay = firstDay.getDay();
  
  // Add empty cells for days before first of month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  
  // Add days of month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  // Function to get pushup count for a specific date
  const getPushupCount = (date: Date): number => {
    if (!date) return 0;
    
    // Create a date string in YYYY-MM-DD format for the calendar date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Find matching entry in pushup data
    const entry = pushupData.find(data => data.date === dateString);
    
    // Debug
    console.log(`Checking date: ${dateString}, Found: ${entry ? entry.count : 0}`);
    
    return entry ? entry.count : 0;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center backdrop-blur-sm bg-black/25 pt-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-4 w-11/12 sm:w-96 shadow-lg h-fit">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select a Date</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2">
              <FaChevronLeft />
            </button>
            <span className="font-semibold">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2">
              <FaChevronRight />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium py-1">
                {day}
              </div>
            ))}
            {days.map((date, index) => {
              // Ensure we're comparing dates properly by setting hours to 0
              const dateToCompare = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
              const isFutureDate = dateToCompare ? dateToCompare > today : false;
              
              // Only get pushup count if it's not a future date
              const pushupCount = (date && !isFutureDate) ? getPushupCount(date) : 0;
              
              return (
                <div key={index} className="relative">
                  <button
                    onClick={() => date && !isFutureDate && onSelectDate(date)}
                    disabled={isFutureDate}
                    className={`
                      p-2 text-center rounded w-full h-full flex flex-col items-center justify-start
                      ${!date ? 'invisible' : ''}
                      ${date?.toDateString() === today.toDateString() ? 'bg-blue-100' : ''}
                      ${isFutureDate ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                    `}
                  >
                    <span className="mb-1">{date?.getDate()}</span>
                    {date && !isFutureDate && pushupCount > 0 && (
                      <div className="flex items-center text-xs text-blue-600">
                        <FaDumbbell className="mr-1 text-blue-600" size={12} />
                        <span>{pushupCount}</span>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 