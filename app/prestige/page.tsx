// app/prestige/page.tsx
"use client";

import { useEffect } from "react";
import { useAchievements } from "../context/AchievementContext";
import { usePrestige } from "../context/PrestigeContext";

export default function PrestigeRoadmap() {
  const { unlocked, allBadges, validateAchievements, checkForAchievements } = useAchievements();
  const { prestige } = usePrestige();

  // Validate achievements when the page loads
  useEffect(() => {
    validateAchievements();
    checkForAchievements();
  }, [validateAchievements, checkForAchievements]);

  // Group all badges by prestige rank
  const groupedByRank: { [rank: number]: typeof allBadges } = {};
  allBadges.forEach((badge) => {
    if (!groupedByRank[badge.rank]) groupedByRank[badge.rank] = [];
    groupedByRank[badge.rank].push(badge);
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">🧱 Prestige Roadmap</h2>
      <p className="mb-8 text-gray-600 dark:text-gray-300">
        Preview all 10 prestige levels and their achievements.
      </p>

      <div className="space-y-10">
        {[...Array(10)].map((_, i) => {
          const rank = i + 1;
          const badges = groupedByRank[rank] || [];

          return (
            <div key={rank}>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Prestige {rank} {prestige === rank && "(Current)"}
              </h3>
              {badges.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`
                        p-4 rounded shadow w-40 text-center border
                        transform transition-all duration-200 ease-in-out
                        hover:scale-105 hover:shadow-xl
                        ${unlocked.includes(badge.id)
                          ? "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500"
                          : rank > prestige
                            ? "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-30"
                            : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-50"}
                      `}
                    >
                      <div className="text-3xl mb-1">{badge.emoji}</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{badge.name}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500">No badges defined for this rank yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
