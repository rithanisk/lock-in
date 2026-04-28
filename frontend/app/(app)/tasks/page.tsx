"use client";

import { useEffect, useMemo, useState } from "react";
import { TaskCard } from "@/components/custom/TaskCard";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import api from "@/lib/api";

const PAST_STATUSES: TaskStatus[] = ["completed", "failed", "expired", "declined"];

function isPastTask(task: Task) {
  return PAST_STATUSES.includes(task.status);
}

export default function TasksPage() {
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [verifyingTasks, setVerifyingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"my" | "verifying">("my");
  const [pastExpanded, setPastExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [myRes, verRes] = await Promise.all([
          api.get("/tasks/my"),
          api.get("/tasks/verifying"),
        ]);
        setMyTasks(myRes.data);
        setVerifyingTasks(verRes.data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const tasks = tab === "my" ? myTasks : verifyingTasks;

  const { activeTasks, pastTasks } = useMemo(() => {
    const active = tasks.filter((t) => !isPastTask(t));
    const past = tasks.filter((t) => isPastTask(t));
    return { activeTasks: active, pastTasks: past };
  }, [tasks]);

  const myPendingCount = myTasks.filter((t) => t.status === "pending_acceptance").length;
  const verifyingPendingCount = verifyingTasks.filter((t) => t.status === "pending_acceptance").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stakes</h1>
        <Link href="/tasks/new">
          <button className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
            + Stake
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        <button
          type="button"
          onClick={() => setTab("my")}
          className={cn(
            "flex-1 text-sm font-medium py-2 rounded-lg transition-colors inline-flex items-center justify-center gap-2",
            tab === "my"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          <span className="inline-flex items-center gap-2">
            My Stakes ({myTasks.length})
            {myPendingCount > 0 && (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-amber-500 ring-2 ring-background"
                title={`${myPendingCount} awaiting verifier`}
                aria-label={`${myPendingCount} pending acceptance`}
              />
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("verifying")}
          className={cn(
            "flex-1 text-sm font-medium py-2 rounded-lg transition-colors inline-flex items-center justify-center gap-2",
            tab === "verifying"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          <span className="inline-flex items-center gap-2">
            Verifying ({verifyingTasks.length})
            {verifyingPendingCount > 0 && (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-sky-500 ring-2 ring-background"
                title={`${verifyingPendingCount} need your response`}
                aria-label={`${verifyingPendingCount} pending your acceptance`}
              />
            )}
          </span>
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center">
            <p className="text-muted-foreground">
              {tab === "my" ? "No stakes yet" : "Nothing to verify"}
            </p>
          </div>
        ) : (
          <>
            {activeTasks.length === 0 && pastTasks.length > 0 ? (
              <p className="text-center py-4 text-sm text-muted-foreground">No active stakes</p>
            ) : (
              activeTasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}

            {pastTasks.length > 0 && (
              <div className="pt-2 border-t border-border space-y-3">
                <button
                  type="button"
                  onClick={() => setPastExpanded((e) => !e)}
                  className="w-full flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 text-left text-sm font-medium hover:bg-muted/60 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    Past stakes
                    <span className="text-muted-foreground font-normal">({pastTasks.length})</span>
                  </span>
                  <span className="text-muted-foreground text-xs" aria-hidden>
                    {pastExpanded ? "Hide" : "Show"}
                  </span>
                </button>
                {pastExpanded &&
                  pastTasks.map((task) => <TaskCard key={task.id} task={task} showSubmit={false} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
