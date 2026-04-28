"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/custom/StatusBadge";
import type { Task } from "@/types";

const categoryColors: Record<string, string> = {
  study: "bg-indigo-100 text-indigo-700",
  fitness: "bg-orange-100 text-orange-700",
  wellness: "bg-green-100 text-green-700",
  productivity: "bg-blue-100 text-blue-700",
  social: "bg-pink-100 text-pink-700",
  custom: "bg-gray-100 text-gray-700",
};

function getTimeLeft(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m`;
  }
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface TaskCardProps {
  task: Task;
  showSubmit?: boolean;
}

export function TaskCard({ task, showSubmit }: TaskCardProps) {
  const isActive = task.status === "active";
  const timeLeft = getTimeLeft(task.deadline);

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
        {/* Top row: category, time, amount */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-0.5 rounded-full capitalize",
                categoryColors[task.category] ?? categoryColors.custom
              )}
            >
              {task.category}
            </span>
            {isActive && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {timeLeft}
              </span>
            )}
          </div>
          <span className="text-accent font-bold">$ {task.stake_amount}</span>
        </div>

        {/* Title */}
        <p className="font-semibold text-foreground mb-3">{task.title}</p>

        {/* Bottom row: verifier + action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Verifier: {task.verifier_name ?? "Unknown"}
          </div>
          <div className="flex flex-col items-end gap-1">
            {isActive && showSubmit !== false && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Submit
              </span>
            )}
            {(!isActive || showSubmit === false) && (
              <StatusBadge status={task.status} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
