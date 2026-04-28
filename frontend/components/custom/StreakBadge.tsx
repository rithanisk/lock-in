"use client";

import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export function StreakBadge({ streak, className }: StreakBadgeProps) {
  return (
    <div className={cn("inline-flex items-center rounded-xl bg-gray-800 px-4 py-2", className)}>
      <div className="text-center">
        <p className="text-xl font-bold text-white leading-none">{streak}</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
          Streak
        </p>
      </div>
    </div>
  );
}
