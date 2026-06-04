"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/custom/StatusBadge";
import type { Task } from "@/types";

const categoryLabel: Record<string, string> = {
  study: "Study", fitness: "Fitness", wellness: "Wellness",
  productivity: "Productive", social: "Social", custom: "Custom",
};

function getTimeLeft(deadline: string): { text: string; urgent: boolean } {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { text: "Expired", urgent: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) { const mins = Math.floor(diff / (1000 * 60)); return { text: `${mins}m left`, urgent: true }; }
  if (hours < 24) return { text: `${hours}h left`, urgent: hours < 6 };
  const days = Math.floor(hours / 24);
  return { text: `${days}d left`, urgent: false };
}

interface TaskCardProps {
  task: Task;
  showSubmit?: boolean;
}

export function TaskCard({ task, showSubmit }: TaskCardProps) {
  const isActive = task.status === "active";
  const { text: timeText, urgent } = getTimeLeft(task.deadline);

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="rounded-xl bg-card border border-border flex overflow-hidden active:scale-[0.99] transition-transform card-shadow">
        <div className="flex-1 px-3.5 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-snug truncate text-foreground">{task.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {categoryLabel[task.category] ?? task.category}
              {task.verifier_name && ` · ${task.verifier_name}`}
              {isActive && (
                <span className={urgent ? " text-red-400" : ""}>{` · ${timeText}`}</span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-number text-sm font-semibold text-accent tabular-nums">
              {task.stake_amount}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">LC</span>
            </span>
            {isActive && showSubmit !== false ? (
              <span className="inline-flex rounded-md bg-accent/15 text-accent border border-accent/20 px-2 py-0.5 text-[10px] font-semibold">Submit</span>
            ) : (
              <StatusBadge status={task.status} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
