// app/data/achievements.ts
import { type Log } from "../context/LogContext";

export type DerivedStats = {
  totalPushups: number;
  daysLogged: number;
  goalsHit: number;
  dayCounts: { [date: string]: number };
};

export type Badge = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rank: number;
  condition: (logs: Log[], stats: DerivedStats) => boolean;
};

// 📅 Returns a list of sorted unique dates
export const getSortedUniqueDates = (logs: Log[]): string[] => {
  const set = new Set(logs.map((log) => log.timestamp.split("T")[0]));
  return [...set].sort();
};

// 🔁 Calculates the longest daily streak (consecutive calendar days)
export const getLongestStreak = (logs: Log[]): number => {
  if (!logs.length) return 0;
  
  // Extract dates and normalize them to start of day
  const dateObjs = logs.map(log => {
    const date = new Date(log.timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  });
  
  // Get unique dates by converting to strings in format YYYY-MM-DD
  const uniqueDates = Array.from(new Set(dateObjs.map(date => 
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  ))).sort();
  
  console.log("Unique dates for streak calculation:", uniqueDates);
  
  if (uniqueDates.length === 0) return 0;
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const currParts = uniqueDates[i].split('-').map(Number);
    const prevParts = uniqueDates[i-1].split('-').map(Number);
    
    // Create date objects for comparison (using noon to avoid DST issues)
    const currDate = new Date(currParts[0], currParts[1]-1, currParts[2], 12);
    const prevDate = new Date(prevParts[0], prevParts[1]-1, prevParts[2], 12);
    
    // Calculate difference in days
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    console.log(`Comparing ${uniqueDates[i-1]} and ${uniqueDates[i]}: diff = ${diffDays} days`);
    
    if (Math.round(diffDays) === 1) {
      currentStreak++;
      console.log(`Streak continued: ${currentStreak}`);
    } else {
      console.log(`Streak broken at ${uniqueDates[i-1]} to ${uniqueDates[i]} (${diffDays} days)`);
      currentStreak = 1;
    }
    
    maxStreak = Math.max(maxStreak, currentStreak);
  }
  
  console.log(`Final max streak: ${maxStreak}`);
  return maxStreak;
};

// Helper function to get daily session counts
export const getDailySessionCounts = (logs: Log[]): { [date: string]: number } => {
  const dailyCounts: { [date: string]: number } = {};
  
  // Make sure logs are processed in chronological order
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  sortedLogs.forEach(log => {
    // Create a date object and extract just the date part in YYYY-MM-DD format
    const date = new Date(log.timestamp);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // Increment the count for this date
    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
  });
  
  console.log("Daily session counts:", dailyCounts);
  return dailyCounts;
};

export const ALL_BADGES: Badge[] = [
  {
    id: "first_pushup",
    name: "First Step",
    emoji: "👣",
    description: "Log your first pushup",
    rank: 1,
    condition: (logs) => logs.length > 0,
  },
  {
    id: "daily_goal",
    name: "Goal Getter",
    emoji: "🎯",
    description: "Reach your daily goal for the first time",
    rank: 1,
    condition: (_, stats) => stats.goalsHit >= 1,
  },
  {
    id: "fifty_total",
    name: "Fifty Club",
    emoji: "5️⃣",
    description: "Complete 50 total pushups",
    rank: 1,
    condition: (_, stats) => stats.totalPushups >= 50,
  },
  {
    id: "hundred_club",
    name: "Century Club",
    emoji: "💯",
    description: "Complete 100 total pushups",
    rank: 1,
    condition: (_, stats) => stats.totalPushups >= 100,
  },
  {
    id: "three_day_streak",
    name: "Three Days Strong",
    emoji: "📅",
    description: "Log pushups for 3 days in a row",
    rank: 1,
    condition: (logs) => getLongestStreak(logs) >= 3,
  },
  {
    id: "five_sessions",
    name: "Five Timer",
    emoji: "⏱️",
    description: "Log 5 different pushup sessions",
    rank: 1,
    condition: (logs) => logs.length >= 5,
  },
  {
    id: "twenty_five_day",
    name: "Daily Champion",
    emoji: "🏆",
    description: "Complete 25 pushups in one day",
    rank: 1,
    condition: (_, stats) => Object.values(stats.dayCounts).some(count => count >= 25),
  },
  {
    id: "three_sessions_day",
    name: "Triple Session",
    emoji: "🔄",
    description: "Log pushups 3 times in one day",
    rank: 1,
    condition: (logs) => {
      console.log("Checking Triple Session badge condition...");
      console.log("Total logs:", logs.length);
      
      // Get counts of logs per day
      const daily = getDailySessionCounts(logs);
      
      // Find any day with 3+ sessions
      const daysWithTriple = Object.entries(daily)
        .filter(([_, count]) => count >= 3)
        .map(([date]) => date);
      
      const hasTripleSession = daysWithTriple.length > 0;
      
      console.log("Days with 3+ sessions:", daysWithTriple);
      console.log("Triple Session qualifies:", hasTripleSession);
      
      return hasTripleSession;
    },
  },
  {
    id: "five_goals",
    name: "Goal Streak",
    emoji: "🎪",
    description: "Hit your daily goal 5 times",
    rank: 1,
    condition: (_, stats) => stats.goalsHit >= 5,
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    emoji: "🗓️",
    description: "Log pushups for 7 days in a row",
    rank: 1,
    condition: (logs) => {
      console.log("Checking Week Warrior badge condition...");
      console.log("Total logs:", logs.length);
      
      // Print all log dates for debugging
      const allDates = logs.map(log => {
        const d = new Date(log.timestamp);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }).sort();
      
      console.log("All log dates:", [...new Set(allDates)]);
      
      // Calculate streak
      const streak = getLongestStreak(logs);
      const qualifies = streak >= 7;
      
      console.log(`Week Warrior: longest streak = ${streak}, qualifies = ${qualifies}`);
      return qualifies;
    },
  },
];
