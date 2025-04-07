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
  const dates = [...new Set(logs.map(log => 
    new Date(log.timestamp).toISOString().split('T')[0]
  ))].sort();
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const curr = new Date(dates[i]);
    const prev = new Date(dates[i - 1]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
};

// Helper function to get daily session counts
export const getDailySessionCounts = (logs: Log[]): { [date: string]: number } => {
  const dailyCounts: { [date: string]: number } = {};
  logs.forEach(log => {
    const date = new Date(log.timestamp).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });
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
      const daily = getDailySessionCounts(logs);
      return Object.values(daily).some(count => count >= 3);
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
    condition: (logs) => getLongestStreak(logs) >= 7,
  },
];
