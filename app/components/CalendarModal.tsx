import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface CalendarModalProps {
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

export default function CalendarModal({ onClose, onSelectDate }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => date && onSelectDate(date)}
                className={`
                  p-2 text-center rounded hover:bg-blue-50
                  ${!date ? 'invisible' : ''}
                  ${date?.toDateString() === new Date().toDateString() ? 'bg-blue-100' : ''}
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 