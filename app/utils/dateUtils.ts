// Format a date as "April 4"
export const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
};

// Format timestamp to time
export const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Compare if two dates are the same day
export const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}; 