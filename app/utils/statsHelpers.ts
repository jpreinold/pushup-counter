// app/utils/statsHelpers.ts
import { Log } from "../context/LogContext";

export const getHourlySessionCounts = (logs: Log[]) => {
  const counts: { [hour: string]: number } = {};
  logs.forEach((log) => {
    const hourKey = new Date(log.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    counts[hourKey] = (counts[hourKey] || 0) + 1;
  });
  return counts;
};

export const getDailySessionCounts = (logs: Log[]) => {
  const counts: { [day: string]: number } = {};
  logs.forEach((log) => {
    const date = log.timestamp.toISOString().split("T")[0];
    counts[date] = (counts[date] || 0) + 1;
  });
  return counts;
};

export const getWeeklyPushupCounts = (logs: Log[]) => {
  const weekMap: { [week: string]: number } = {};
  logs.forEach((log) => {
    const date = new Date(log.timestamp);
    const year = date.getFullYear();
    const start = new Date(year, 0, 1);
    const weekNum = Math.floor((+date - +start) / (7 * 24 * 60 * 60 * 1000));
    const key = `${year}-W${weekNum}`;
    weekMap[key] = (weekMap[key] || 0) + log.count;
  });
  return weekMap;
};

export const getMaxInMap = (map: { [key: string]: number }) =>
  Object.values(map).reduce((max, curr) => Math.max(max, curr), 0);
