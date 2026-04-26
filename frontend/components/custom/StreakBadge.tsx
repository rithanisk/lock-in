"use client";

import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export function StreakBadge({ streak, className }: StreakBadgeProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-orange-500 text-lg">&#x1F525;</span>
      <span className="font-semibold">{streak}</span>
      <span className="text-sm text-muted-foreground">day streak</span>
    </div>
  );
}
