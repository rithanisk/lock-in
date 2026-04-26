"use client";

import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/types";

const statusConfig: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_acceptance: { label: "Pending", variant: "outline" },
  active: { label: "Active", variant: "default" },
  proof_submitted: { label: "Proof Submitted", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  expired: { label: "Expired", variant: "outline" },
  declined: { label: "Declined", variant: "destructive" },
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
