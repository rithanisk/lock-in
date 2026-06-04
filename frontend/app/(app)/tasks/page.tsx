"use client";

import { useEffect, useMemo, useState } from "react";
import { TaskCard } from "@/components/custom/TaskCard";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import api from "@/lib/api";

const PAST_STATUSES: TaskStatus[] = ["completed", "failed", "expired", "declined"];
function isPastTask(task: Task) { return PAST_STATUSES.includes(task.status); }

export default function TasksPage() {
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [verifyingTasks, setVerifyingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"my" | "verifying">("my");
  const [pastExpanded, setPastExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [myRes, verRes] = await Promise.all([api.get("/tasks/my"), api.get("/tasks/verifying")]);
        setMyTasks(myRes.data);
        setVerifyingTasks(verRes.data);
      } catch { /**/ } finally { setLoading(false); }
    }
    load();
  }, []);

  const tasks = tab === "my" ? myTasks : verifyingTasks;
  const { activeTasks, pastTasks } = useMemo(() => ({
    activeTasks: tasks.filter((t) => !isPastTask(t)),
    pastTasks: tasks.filter((t) => isPastTask(t)),
  }), [tasks]);

  const myPendingCount = myTasks.filter((t) => t.status === "pending_acceptance").length;
  const verifyPendingCount = verifyingTasks.filter((t) => t.status === "pending_acceptance").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Stakes</h1>
        <Link href="/tasks/new">
          <button className="rounded-2xl bg-foreground text-background px-4 py-2 text-sm font-semibold active:scale-95 transition-transform">
            + New
          </button>
        </Link>
      </div>

      {/* Segment control */}
      <div className="flex gap-1 bg-muted rounded-2xl p-1">
        {([
          { key: "my", label: "My Stakes", count: myTasks.length, pending: myPendingCount },
          { key: "verifying", label: "Verifying", count: verifyingTasks.length, pending: verifyPendingCount },
        ] as const).map(({ key, label, count, pending }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={cn("flex-1 text-sm font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2",
              tab === key ? "bg-card text-foreground card-shadow" : "text-muted-foreground"
            )}
          >
            {label}
            <span className={cn("text-xs rounded-full px-1.5 py-0.5 font-semibold min-w-[20px] text-center",
              tab === key ? "bg-muted text-foreground" : "bg-transparent text-muted-foreground"
            )}>
              {count}
            </span>
            {pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {loading ? (
          <div className="flex flex-col gap-1.5">
            {[1, 2, 3].map(i => <div key={i} className="rounded-xl bg-card border border-border/60 h-14 animate-pulse" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {tab === "my" ? "No stakes yet — create one!" : "Nothing to verify right now"}
            </p>
          </div>
        ) : (
          <>
            {activeTasks.length === 0 && pastTasks.length > 0 && (
              <p className="text-center py-3 text-sm text-muted-foreground">No active stakes</p>
            )}
            <div className="flex flex-col gap-1.5">
              {activeTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>

            {pastTasks.length > 0 && (
              <div className="pt-1">
                <button type="button" onClick={() => setPastExpanded((e) => !e)}
                  className="w-full flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted mb-3">
                  <span className="flex items-center gap-2">
                    Past
                    <span className="text-muted-foreground font-normal text-xs">({pastTasks.length})</span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("transition-transform text-muted-foreground", pastExpanded && "rotate-180")}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {pastExpanded && (
                  <div className="flex flex-col gap-1.5">
                    {pastTasks.map((task) => <TaskCard key={task.id} task={task} showSubmit={false} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
