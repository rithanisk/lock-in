"use client";

import { cn } from "@/lib/utils";

interface CoinBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}

export function CoinBadge({ amount, size = "md", className }: CoinBadgeProps) {
  const sizeClasses = {
    sm: "text-sm font-semibold",
    md: "text-base font-semibold",
    lg: "text-lg font-bold",
    hero: "text-4xl font-bold tracking-tight",
  };

  return (
    <span className={cn("text-accent inline-flex items-baseline", sizeClasses[size], className)}>
      <span className="mr-0.5">$</span>
      {amount.toFixed(2)}
    </span>
  );
}
