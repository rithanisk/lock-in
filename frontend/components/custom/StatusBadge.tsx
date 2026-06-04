"use client";

import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending_acceptance: { label: "Pending",   className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  active:             { label: "Active",    className: "bg-accent/10 text-accent border border-accent/20" },
  proof_submitted:    { label: "Reviewing", className: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
  completed:          { label: "Done",      className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  failed:             { label: "Failed",    className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  expired:            { label: "Expired",   className: "bg-muted text-muted-foreground border border-border" },
  declined:           { label: "Declined",  className: "bg-red-500/10 text-red-400 border border-red-500/20" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md", config.className)}>
      {config.label}
    </span>
  );
}
