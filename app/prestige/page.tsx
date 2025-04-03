// app/prestige/page.tsx
"use client";

import { useAchievements } from "../context/AchievementContext";
import { usePrestige } from "../context/PrestigeContext";

export default function PrestigeRoadmap() {
  const { unlocked, allBadges } = useAchievements();
  const { prestige } = usePrestige();

  // Group all badges by prestige rank
  const groupedByRank: { [rank: number]: typeof allBadges } = {};
  allBadges.forEach((badge) => {
    if (!groupedByRank[badge.rank]) groupedByRank[badge.rank] = [];
    groupedByRank[badge.rank].push(badge);
  });

  return (
    <div className="bg-white p-6 rounded shadow max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🧱 Prestige Roadmap</h2>
      <p className="mb-8 text-gray-600">
        Preview all 10 prestige levels and their achievements.
      </p>

      <div className="space-y-10">
        {[...Array(10)].map((_, i) => {
          const rank = i + 1;
          const badges = groupedByRank[rank] || [];

          return (
            <div key={rank}>
              <h3 className="text-lg font-semibold mb-3">
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
                          ? "bg-green-100 border-green-400"
                          : rank > prestige
                            ? "bg-gray-100 border-gray-200 opacity-30"
                            : "bg-gray-100 border-gray-300 opacity-50"}
                      `}
                    >
                      <div className="text-3xl mb-1">{badge.emoji}</div>
                      <div className="font-semibold">{badge.name}</div>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No badges defined for this rank yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
