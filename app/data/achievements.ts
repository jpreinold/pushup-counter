// app/data/achievements.ts
import { type Log } from "../context/LogContext";
import {
    getHourlySessionCounts,
    getDailySessionCounts,
    getWeeklyPushupCounts,
    getMaxInMap,
  } from "../utils/statsHelpers";

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
    condition: (
      logs: Log[],
      stats: DerivedStats,
      unlockedBadges?: string[],
      allBadges?: Badge[]
    ) => boolean;
  };

// 📅 Returns a list of sorted unique dates
export const getSortedUniqueDates = (logs: Log[]): string[] => {
    const set = new Set(logs.map((log) => log.timestamp.split("T")[0]));
    return [...set].sort();
};
  
// 🔁 Calculates the longest daily streak (consecutive calendar days)
export const getLongestStreak = (logs: Log[]): number => {
const dates = getSortedUniqueDates(logs);
let streak = 1;
let maxStreak = 0;

for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
    streak++;
    maxStreak = Math.max(maxStreak, streak);
    } else {
    streak = 1;
    }
}

return maxStreak;
};

// 🌙 Night session count
export const countSessionsAfterHour = (logs: Log[], hour: number): number =>
logs.filter((log) => new Date(log.timestamp).getHours() >= hour).length;

// 🌅 Early morning session count
export const countSessionsBeforeHour = (logs: Log[], hour: number): number =>
logs.filter((log) => new Date(log.timestamp).getHours() < hour).length;

// 🧠 Counts how many days had X+ pushups
export const countDaysWithMinimum = (dayCounts: { [key: string]: number }, min: number): number =>
Object.values(dayCounts).filter((count) => count >= min).length;

export const countDaysWithSessions = (dailyMap: { [key: string]: number }, minPerDay: number): number =>
    Object.values(dailyMap).filter((count) => count >= minPerDay).length;
  

export const ALL_BADGES: Badge[] = [
    // --- Prestige 1 ---
    {
        id: "starter",
        name: "Starter",
        emoji: "🌟",
        description: "First pushup logged!",
        rank: 1,
        condition: (logs) => logs.length > 0,
    },
    {
        id: "hundred",
        name: "Century Club",
        emoji: "💯",
        description: "100 pushups total!",
        rank: 1,
        condition: (_, stats) => stats.totalPushups >= 100,
    },
    {
        id: "pro",
        name: "Pushup Pro",
        emoji: "🚀",
        description: "500 pushups total!",
        rank: 1,
        condition: (_, stats) => stats.totalPushups >= 500,
    },
    {
        id: "champion",
        name: "Champion",
        emoji: "🥇",
        description: "Hit goal 10 times!",
        rank: 1,
        condition: (_, stats) => stats.goalsHit >= 10,
    },
    {
        id: "day1",
        name: "One Day",
        emoji: "📆",
        description: "Logged a pushup today.",
        rank: 1,
        condition: (_, stats) => stats.daysLogged >= 1,
    },
    {
        id: "firstgoal",
        name: "Goal Getter",
        emoji: "🎯",
        description: "Reached your goal once!",
        rank: 1,
        condition: (_, stats) => stats.goalsHit >= 1,
    },
    {
        id: "firstlog",
        name: "Getting Started",
        emoji: "📝",
        description: "Logged a pushup session.",
        rank: 1,
        condition: (logs) => logs.length >= 1,
    },
    {
        id: "warmup",
        name: "Warm Up",
        emoji: "🔥",
        description: "Did 25 pushups in one day.",
        rank: 1,
        condition: (_, stats) => Object.values(stats.dayCounts).some((c) => c >= 25),
    },
    {
        id: "mini-streak",
        name: "3-Day Streak",
        emoji: "🗓️",
        description: "Logged 3 days in a row.",
        rank: 1,
        condition: (_, stats) => stats.daysLogged >= 3,
    },
    {
        id: "log5",
        name: "Quick Logger",
        emoji: "⏱️",
        description: "Logged 5 different times.",
        rank: 1,
        condition: (logs) => logs.length >= 5,
    },
  
  // --- Prestige 2 ---
    {
        id: "elite1k",
        name: "Elite 1K",
        emoji: "🔥",
        description: "1,000 total pushups!",
        rank: 2,
        condition: (_, stats) => stats.totalPushups >= 1000,
    },
    {
        id: "weekly7",
        name: "Weekly Grinder",
        emoji: "📅",
        description: "7 days logged in a row!",
        rank: 2,
        condition: (_, stats) => stats.daysLogged >= 7,
    },
    {
        id: "goal20",
        name: "20x Goal Crusher",
        emoji: "🎯",
        description: "Hit daily goal 20 times!",
        rank: 2,
        condition: (_, stats) => stats.goalsHit >= 20,
    },
    {
        id: "day500",
        name: "Super Session",
        emoji: "💪",
        description: "500 pushups in one day!",
        rank: 2,
        condition: (_, stats) => Object.values(stats.dayCounts).some((c) => c >= 500),
    },
    {
        id: "log20",
        name: "Dedicated",
        emoji: "🕒",
        description: "Logged 20 different sessions.",
        rank: 2,
        condition: (logs) => logs.length >= 20,
    },
    {
        id: "day14",
        name: "2-Week Warrior",
        emoji: "🗓️",
        description: "Logged for 14 days straight.",
        rank: 2,
        condition: (_, stats) => stats.daysLogged >= 14,
    },
    {
        id: "fastlog",
        name: "Fast Fingers",
        emoji: "⚡",
        description: "Logged pushups 3x in one hour.",
        rank: 2,
        condition: (logs) => {
          const hourly = getHourlySessionCounts(logs);
          return getMaxInMap(hourly) >= 3;
        },
      },
    {
        id: "2000total",
        name: "Grinder",
        emoji: "🛠️",
        description: "2,000 total pushups!",
        rank: 2,
        condition: (_, stats) => stats.totalPushups >= 2000,
    },
    {
        id: "triplethreat",
        name: "Triple Threat",
        emoji: "🏋️",
        description: "3 sessions in one day!",
        rank: 2,
        condition: (logs) => {
          const daily = getDailySessionCounts(logs);
          return getMaxInMap(daily) >= 3;
        },
      },
      {
        id: "sevenhundred",
        name: "700 Club",
        emoji: "🔵",
        description: "700 pushups in a week!",
        rank: 2,
        condition: (logs) => {
          const weekMap = getWeeklyPushupCounts(logs);
          return getMaxInMap(weekMap) >= 700;
        },
      },
      // --- Prestige 3 ---
    {
        id: "streak21",
        name: "21-Day Streak",
        emoji: "🏁",
        description: "21 days in a row!",
        rank: 3,
        condition: (_, stats) => stats.daysLogged >= 21,
    },
    {
        id: "5000pushups",
        name: "Halfway Hero",
        emoji: "📦",
        description: "5,000 total pushups!",
        rank: 3,
        condition: (_, stats) => stats.totalPushups >= 5000,
    },
    {
        id: "goal50",
        name: "Goal King",
        emoji: "👑",
        description: "Hit goal 50 times!",
        rank: 3,
        condition: (_, stats) => stats.goalsHit >= 50,
    },
    {
        id: "day750",
        name: "One-Day Monster",
        emoji: "🧠",
        description: "750 pushups in a single day!",
        rank: 3,
        condition: (_, stats) => Object.values(stats.dayCounts).some((count) => count >= 750),
    },
    {
        id: "session50",
        name: "Clocked In",
        emoji: "⏰",
        description: "50 log sessions.",
        rank: 3,
        condition: (logs) => logs.length >= 50,
    },
    {
        id: "combo10",
        name: "Combo Counter",
        emoji: "🔁",
        description: "10 days with at least 2 sessions each.",
        rank: 3,
        condition: (logs) => {
        const daily = getDailySessionCounts(logs);
        return Object.values(daily).filter((count) => count >= 2).length >= 10;
        },
    },
    {
        id: "3kinweek",
        name: "3000 Club",
        emoji: "🏆",
        description: "3,000 pushups in one week!",
        rank: 3,
        condition: (logs) => {
        const weekMap = getWeeklyPushupCounts(logs);
        return getMaxInMap(weekMap) >= 3000;
        },
    },
    {
        id: "total7500",
        name: "Push Through",
        emoji: "🏋️‍♂️",
        description: "7,500 pushups total.",
        rank: 3,
        condition: (_, stats) => stats.totalPushups >= 7500,
    },
    {
        id: "massive1k",
        name: "1K Day",
        emoji: "🧱",
        description: "1,000 pushups in a single day!",
        rank: 3,
        condition: (_, stats) => Object.values(stats.dayCounts).some((count) => count >= 1000),
    },
    {
        id: "streak-breakless",
        name: "Unbroken",
        emoji: "🕊️",
        description: "30+ day streak without missing a day!",
        rank: 3,
        condition: (_, stats) => stats.daysLogged >= 30,
    },
  
    // --- Prestige 4 ---
    {   
        id: "daily10x",
        name: "Daily Grinder",
        emoji: "📍",
        description: "Logged 10 days in a row.",
        rank: 4,
        condition: (_, stats) => stats.daysLogged >= 10,
    },
    {
        id: "daily50x",
        name: "50-Day Streak",
        emoji: "🧭",
        description: "Logged 50 unique days.",
        rank: 4,
        condition: (_, stats) => stats.daysLogged >= 50,
    },
    {
        id: "push15k",
        name: "15K Club",
        emoji: "🎖️",
        description: "15,000 total pushups!",
        rank: 4,
        condition: (_, stats) => stats.totalPushups >= 15000,
    },
    {
        id: "goal75",
        name: "Goal Dominator",
        emoji: "🥶",
        description: "Hit goal 75 times!",
        rank: 4,
        condition: (_, stats) => stats.goalsHit >= 75,
    },
    {
        id: "1kweek",
        name: "1K Week",
        emoji: "📈",
        description: "1,000 pushups in one week!",
        rank: 4,
        condition: (logs) => {
        const weekMap = getWeeklyPushupCounts(logs);
        return getMaxInMap(weekMap) >= 1000;
        },
    },
    {
        id: "tripletriple",
        name: "3x3",
        emoji: "🍱",
        description: "3 sessions/day for 3 straight days.",
        rank: 4,
        condition: (logs) => {
        const daily = getDailySessionCounts(logs);
        const sorted = Object.entries(daily)
            .sort(([a], [b]) => (a > b ? 1 : -1))
            .map(([, count]) => count >= 3);
    
        let streak = 0;
        for (let val of sorted) {
            streak = val ? streak + 1 : 0;
            if (streak >= 3) return true;
        }
        return false;
        },
    },
    {
        id: "morningmaster",
        name: "Morning Hustler",
        emoji: "☀️",
        description: "5 sessions before 10AM.",
        rank: 4,
        condition: (logs) =>
        logs.filter((log) => {
            const hour = new Date(log.timestamp).getHours();
            return hour < 10;
        }).length >= 5,
    },
    {
        id: "week6x",
        name: "6 of 7",
        emoji: "📆",
        description: "Logged 6 out of 7 days in one week.",
        rank: 4,
        condition: (logs) => countSessionsBeforeHour(logs, 10) >= 5,
    },
    {
        id: "500inaday",
        name: "Five Hundred Fury",
        emoji: "⚔️",
        description: "500 pushups in one day, 3 times.",
        rank: 4,
        condition: (_, stats) =>
        Object.values(stats.dayCounts).filter((count) => count >= 500).length >= 3,
    },
    {
        id: "bigweek",
        name: "Mega Week",
        emoji: "💥",
        description: "7 logs in a week + 2,000 pushups total.",
        rank: 4,
        condition: (logs) => {
        const weekMap = getWeeklyPushupCounts(logs);
        const sessionCountPerWeek: { [week: string]: number } = {};
        logs.forEach((log) => {
            const date = new Date(log.timestamp);
            const year = date.getFullYear();
            const start = new Date(year, 0, 1);
            const weekNum = Math.floor((+date - +start) / (7 * 24 * 60 * 60 * 1000));
            const weekKey = `${year}-W${weekNum}`;
            sessionCountPerWeek[weekKey] = (sessionCountPerWeek[weekKey] || 0) + 1;
        });
    
        return Object.entries(weekMap).some(
            ([week, pushupCount]) => sessionCountPerWeek[week] >= 7 && pushupCount >= 2000
        );
        },
    },

    // --- Prestige 5 ---
    {
        id: "streak75",
        name: "75-Day Streak",
        emoji: "📍",
        description: "Logged 75 days in a row!",
        rank: 5,
        condition: (_, stats) => stats.daysLogged >= 75,
    },
    {
        id: "push20k",
        name: "Pushed 20K",
        emoji: "🏔️",
        description: "20,000 pushups total!",
        rank: 5,
        condition: (_, stats) => stats.totalPushups >= 20000,
    },
    {
        id: "goal100",
        name: "Century Goals",
        emoji: "💯",
        description: "Hit daily goal 100 times!",
        rank: 5,
        condition: (_, stats) => stats.goalsHit >= 100,
    },
    {
        id: "combo7x",
        name: "7x Combo Days",
        emoji: "🔂",
        description: "7 days with 2+ logs per day.",
        rank: 5,
        condition: (logs) => {
        const daily = getDailySessionCounts(logs);
        return Object.values(daily).filter((count) => count >= 2).length >= 7;
        },
    },
    {
        id: "nightowl",
        name: "Night Owl",
        emoji: "🌙",
        description: "Logged pushups after 10PM 10 times.",
        rank: 5,
        condition: (logs) => countSessionsAfterHour(logs, 22) >= 10,
    },
    {
        id: "3kweek",
        name: "3K in 7",
        emoji: "🏋️‍♀️",
        description: "3,000 pushups in one week!",
        rank: 5,
        condition: (logs) => {
        const weekMap = getWeeklyPushupCounts(logs);
        return getMaxInMap(weekMap) >= 3000;
        },
    },
    {
        id: "log100",
        name: "100 Logs",
        emoji: "📚",
        description: "Logged 100 pushup sessions.",
        rank: 5,
        condition: (logs) => logs.length >= 100,
    },
    {
        id: "doublegoal",
        name: "Overachiever",
        emoji: "🚨",
        description: "Logged 2x your goal in one day 5 times.",
        rank: 5,
        condition: (_, stats) => countDaysWithMinimum(stats.dayCounts, 100) >= 5,


    },
    {
        id: "fivehundred5x",
        name: "High Five",
        emoji: "✋",
        description: "500+ pushups in a day, 5 different days.",
        rank: 5,
        condition: (_, stats) => countDaysWithMinimum(stats.dayCounts, 500) >= 5,

    },
    {
        id: "gritmaster",
        name: "Grit Master",
        emoji: "🧱",
        description: "Log something 30 days in a row without missing.",
        rank: 5,
        condition: (logs) => getLongestStreak(logs) >= 30,
    },
  
    // --- Prestige 6 ---
    {
        id: "push30k",
        name: "Push Limit",
        emoji: "🔥",
        description: "30,000 pushups total!",
        rank: 6,
        condition: (_, stats) => stats.totalPushups >= 30000,
    },
    {
        id: "streak100",
        name: "100-Day Streak",
        emoji: "🎯",
        description: "100 consecutive days!",
        rank: 6,
        condition: (logs) => getLongestStreak(logs) >= 100,
    },
    {
        id: "goal150",
        name: "150x Goal",
        emoji: "🎖️",
        description: "Hit goal 150 times!",
        rank: 6,
        condition: (_, stats) => stats.goalsHit >= 150,
    },
    {
        id: "nightshift",
        name: "Night Shift",
        emoji: "🦉",
        description: "Logged after midnight 10 times.",
        rank: 6,
        condition: (logs) => countSessionsAfterHour(logs, 0) >= 10,
    },
    {
        id: "total150logs",
        name: "150 Logs",
        emoji: "📘",
        description: "Logged 150 sessions total.",
        rank: 6,
        condition: (logs) => logs.length >= 150,
    },
    {
        id: "7x3combo",
        name: "Triple Threat Week",
        emoji: "🔺",
        description: "3+ logs/day for 7 different days.",
        rank: 6,
        condition: (logs) => countDaysWithSessions(getDailySessionCounts(logs), 3) >= 7,
          
    },
    {
        id: "4kweek",
        name: "Full Throttle",
        emoji: "🛞",
        description: "4,000 pushups in one week!",
        rank: 6,
        condition: (logs) => {
        const weekMap = getWeeklyPushupCounts(logs);
        return getMaxInMap(weekMap) >= 4000;
        },
    },
    {
        id: "monsterday",
        name: "Monster Mode",
        emoji: "💢",
        description: "1,500 pushups in one day.",
        rank: 6,
        condition: (_, stats) => getMaxInMap(stats.dayCounts) >= 1500,
    },
    {
        id: "pridepack",
        name: "No Days Off",
        emoji: "📦",
        description: "Log every day for a full month.",
        rank: 6,
        condition: (logs) => getLongestStreak(logs) >= 30,
    },
    {
        id: "2xweekgoal",
        name: "Stacked Up",
        emoji: "📊",
        description: "Hit goal 2x a day for 7 days.",
        rank: 6,
        condition: (logs) => {
        const daily = getDailySessionCounts(logs);
        return Object.values(daily).filter((count) => count >= 2).length >= 7;
        },
    },

    // --- Prestige 7 ---
    {
        id: "push50k",
        name: "Fifty K",
        emoji: "🏆",
        description: "50,000 total pushups!",
        rank: 7,
        condition: (_, stats) => stats.totalPushups >= 50000,
    },
    {
        id: "streak150",
        name: "Iron Log",
        emoji: "🪓",
        description: "150-day streak!",
        rank: 7,
        condition: (logs) => getLongestStreak(logs) >= 150,
    },
    {
        id: "goal200",
        name: "Goal Fiend",
        emoji: "👹",
        description: "200 goals hit!",
        rank: 7,
        condition: (_, stats) => stats.goalsHit >= 200,
    },
    {
        id: "5kweek",
        name: "5000 in 7",
        emoji: "🚛",
        description: "5,000 pushups in a week!",
        rank: 7,
        condition: (logs) => getMaxInMap(getWeeklyPushupCounts(logs)) >= 5000,
    },
    {
        id: "backtoback",
        name: "Double Day",
        emoji: "🔄",
        description: "2 days in a row with 3 logs each.",
        rank: 7,
        condition: (logs) => {
        const daily = getDailySessionCounts(logs);
        const sorted = Object.entries(daily)
            .sort(([a], [b]) => (a > b ? 1 : -1))
            .map(([, count]) => count >= 3);
    
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] && sorted[i - 1]) return true;
        }
        return false;
        },
    },
    {
        id: "log200",
        name: "200 Sessions",
        emoji: "📖",
        description: "Logged 200 pushup sessions.",
        rank: 7,
        condition: (logs) => logs.length >= 200,
    },
    {
        id: "maxout",
        name: "Daily Maxed",
        emoji: "🧨",
        description: "Hit 2x goal for 7 straight days.",
        rank: 7,
        condition: (_, stats) => {
        const dates = Object.keys(stats.dayCounts).sort();
        const overGoalDays = dates.map((date) => stats.dayCounts[date] >= 100);
    
        let streak = 0;
        for (let i = 0; i < overGoalDays.length; i++) {
            if (overGoalDays[i]) {
            streak++;
            if (streak >= 7) return true;
            } else {
            streak = 0;
            }
        }
        return false;
        },
    },
    {
        id: "nightking",
        name: "Late Legend",
        emoji: "🌌",
        description: "25 logs after 10PM.",
        rank: 7,
        condition: (logs) => countSessionsAfterHour(logs, 22) >= 25,
    },
    {
        id: "perfectweek",
        name: "Perfect Week",
        emoji: "✅",
        description: "Goal hit every day in one week.",
        rank: 7,
        condition: (_, stats) => {
        const sortedDates = Object.keys(stats.dayCounts).sort();
        for (let i = 0; i <= sortedDates.length - 7; i++) {
            const window = sortedDates.slice(i, i + 7);
            const isPerfect = window.every((date) => stats.dayCounts[date] >= 50);
            if (isPerfect) return true;
        }
        return false;
        },
    },
    {
        id: "sundaybeast",
        name: "Sunday Beast",
        emoji: "🦁",
        description: "1,000+ pushups on a Sunday.",
        rank: 7,
        condition: (logs) => {
        const sundayTotals: { [date: string]: number } = {};
        logs.forEach((log) => {
            const d = new Date(log.timestamp);
            if (d.getDay() === 0) {
            const key = d.toISOString().split("T")[0];
            sundayTotals[key] = (sundayTotals[key] || 0) + log.count;
            }
        });
        return Object.values(sundayTotals).some((total) => total >= 1000);
        },
    },
  
    // --- Prestige 8 ---
    {
        id: "push75k",
        name: "Seventy-Five K",
        emoji: "🌋",
        description: "75,000 pushups total!",
        rank: 8,
        condition: (_, stats) => stats.totalPushups >= 75000,
    },
    {
        id: "streak200",
        name: "200-Day Streak",
        emoji: "🛡️",
        description: "Logged 200 days in a row!",
        rank: 8,
        condition: (logs) => getLongestStreak(logs) >= 200,
    },
    {
        id: "log300",
        name: "300 Logs",
        emoji: "📗",
        description: "Logged 300 total sessions!",
        rank: 8,
        condition: (logs) => logs.length >= 300,
    },
    {
        id: "goal300",
        name: "Goal Machine",
        emoji: "⚙️",
        description: "Hit daily goal 300 times!",
        rank: 8,
        condition: (_, stats) => stats.goalsHit >= 300,
    },
    {
        id: "5kday",
        name: "One-Day Titan",
        emoji: "💣",
        description: "5,000 pushups in a single day!",
        rank: 8,
        condition: (_, stats) => getMaxInMap(stats.dayCounts) >= 5000,
    },
    {
        id: "week10k",
        name: "10K Week",
        emoji: "🚀",
        description: "10,000 pushups in one week!",
        rank: 8,
        condition: (logs) => getMaxInMap(getWeeklyPushupCounts(logs)) >= 10000,
    },
    {
        id: "streakperfect30",
        name: "Perfect Month",
        emoji: "🌕",
        description: "Hit goal every day for 30 days straight.",
        rank: 8,
        condition: (_, stats) => {
        const sorted = Object.keys(stats.dayCounts).sort();
        let streak = 0;
        for (let i = 0; i < sorted.length; i++) {
            const date = new Date(sorted[i]);
            const prev = i > 0 ? new Date(sorted[i - 1]) : null;
            const diff = prev ? (date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24) : null;
    
            if (!prev || diff === 1) {
            streak = stats.dayCounts[sorted[i]] >= 50 ? streak + 1 : 0;
            } else {
            streak = 0;
            }
    
            if (streak >= 30) return true;
        }
        return false;
        },
    },
    {
        id: "night100",
        name: "Dark Mode",
        emoji: "🌑",
        description: "100 sessions logged at night.",
        rank: 8,
        condition: (logs) => countSessionsAfterHour(logs, 21) >= 100,
    },
    {
        id: "back2backstreaks",
        name: "Double Streak",
        emoji: "🔁",
        description: "Two 30-day streaks with <3 day break between.",
        rank: 8,
        condition: (logs) => {
        const dates = getSortedUniqueDates(logs);
        let streaks: number[] = [];
        let current = 1;
    
        for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    
            if (diff === 1) {
            current++;
            } else if (diff <= 3) {
            if (current >= 30) streaks.push(current);
            current = 1;
            } else {
            current = 1;
            }
        }
    
        if (current >= 30) streaks.push(current);
        return streaks.length >= 2;
        },
    },
    {
        id: "earlybird30",
        name: "Early Beast",
        emoji: "🌄",
        description: "Logged before 8AM for 30 sessions.",
        rank: 8,
        condition: (logs) => countSessionsBeforeHour(logs, 8) >= 30,
    },
  
    // --- Prestige 9 ---
    {
        id: "push100k",
        name: "100K Master",
        emoji: "👑",
        description: "100,000 pushups total!",
        rank: 9,
        condition: (_, stats) => stats.totalPushups >= 100000,
    },
    {
        id: "streak300",
        name: "Streak Lord",
        emoji: "🔥",
        description: "300-day streak!",
        rank: 9,
        condition: (logs) => getLongestStreak(logs) >= 300,
    },
    {
        id: "log500",
        name: "Log Legend",
        emoji: "📙",
        description: "500 pushup logs.",
        rank: 9,
        condition: (logs) => logs.length >= 500,
    },
    {
        id: "goal500",
        name: "Goal Commander",
        emoji: "🥷",
        description: "Hit your goal 500 times!",
        rank: 9,
        condition: (_, stats) => stats.goalsHit >= 500,
    },
    {
        id: "2kaday7x",
        name: "Superhuman",
        emoji: "🧠",
        description: "2,000 pushups/day for 7 straight days.",
        rank: 9,
        condition: (_, stats) => {
        const sorted = Object.keys(stats.dayCounts).sort();
        let streak = 0;
    
        for (let date of sorted) {
            if (stats.dayCounts[date] >= 2000) {
            streak++;
            if (streak >= 7) return true;
            } else {
            streak = 0;
            }
        }
    
        return false;
        },
    },
    {
        id: "night250",
        name: "Lunar Warrior",
        emoji: "🌕",
        description: "250+ late night logs.",
        rank: 9,
        condition: (logs) => countSessionsAfterHour(logs, 22) >= 250,
    },
    {
        id: "triplecombo",
        name: "Triple Stack",
        emoji: "🧱",
        description: "3 logs/day for 10 days.",
        rank: 9,
        condition: (logs) =>
        countDaysWithSessions(getDailySessionCounts(logs), 3) >= 10,
    },
    {
        id: "yeargoal",
        name: "Year of Goals",
        emoji: "📆",
        description: "Hit daily goal on 365 different days.",
        rank: 9,
        condition: (_, stats) => stats.goalsHit >= 365,
    },
    {
        id: "perfectweek5x",
        name: "Flawless Five",
        emoji: "🧼",
        description: "5 perfect weeks (goal every day).",
        rank: 9,
        condition: (_, stats) => {
        const sorted = Object.keys(stats.dayCounts).sort();
        let perfectWeeks = 0;
    
        for (let i = 0; i <= sorted.length - 7; i++) {
            const week = sorted.slice(i, i + 7);
            const isPerfect = week.every((date) => stats.dayCounts[date] >= 50);
            if (isPerfect) {
            perfectWeeks++;
            i += 6; // skip ahead to avoid overlap
            }
        }
    
        return perfectWeeks >= 5;
        },
    },
    {
        id: "monster5k5x",
        name: "Behemoth",
        emoji: "🐲",
        description: "5,000 pushups in a day, 5 times!",
        rank: 9,
        condition: (_, stats) =>
        countDaysWithMinimum(stats.dayCounts, 5000) >= 5,
    },
  
];
