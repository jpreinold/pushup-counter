// app/components/ProgressBar.tsx
"use client";

type ProgressBarProps = {
  progress: number;
};

export default function ProgressBar({ progress }: ProgressBarProps) {
  const percent = Math.min(Math.max(progress, 0), 100);
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
      <div
        className="bg-blue-500 dark:bg-blue-600 h-4 transition-all duration-500 ease-out"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
}
