"use client";

import { useEffect, useState } from "react";
import { TaskCard } from "@/components/custom/TaskCard";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import api from "@/lib/api";

export default function TasksPage() {
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [verifyingTasks, setVerifyingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"my" | "verifying">("my");

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
          onClick={() => setTab("my")}
          className={cn(
            "flex-1 text-sm font-medium py-2 rounded-lg transition-colors",
            tab === "my"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          My Stakes ({myTasks.length})
        </button>
        <button
          onClick={() => setTab("verifying")}
          className={cn(
            "flex-1 text-sm font-medium py-2 rounded-lg transition-colors",
            tab === "verifying"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          Verifying ({verifyingTasks.length})
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
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
