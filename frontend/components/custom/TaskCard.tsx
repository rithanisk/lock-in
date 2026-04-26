"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinBadge } from "./CoinBadge";
import { StatusBadge } from "./StatusBadge";
import { CountdownTimer } from "./CountdownTimer";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{task.title}</CardTitle>
            <StatusBadge status={task.status} />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <CoinBadge amount={task.stake_amount} size="sm" />
          {task.status === "active" && (
            <CountdownTimer
              deadline={task.deadline}
              className="text-sm text-muted-foreground"
            />
          )}
          <span className="text-xs text-muted-foreground capitalize">{task.category}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
