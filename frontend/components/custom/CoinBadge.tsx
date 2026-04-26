"use client";

import { cn } from "@/lib/utils";

interface CoinBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CoinBadge({ amount, size = "md", className }: CoinBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-lg px-3 py-1.5 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 font-medium",
        sizeClasses[size],
        className
      )}
    >
      <span className="text-amber-500">&#x26A1;</span>
      {amount} LC
    </span>
  );
}
