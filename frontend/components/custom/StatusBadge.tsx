"use client";

import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending_acceptance: { label: "Pending", className: "bg-amber-50 text-amber-700" },
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
  proof_submitted: { label: "Reviewing", className: "bg-blue-50 text-blue-700" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-600" },
  declined: { label: "Declined", className: "bg-red-50 text-red-700" },
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", config.className)}>
      {config.label}
    </span>
  );
}
