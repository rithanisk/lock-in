"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinBadge } from "@/components/custom/CoinBadge";
import { StreakBadge } from "@/components/custom/StreakBadge";
import { TaskCard } from "@/components/custom/TaskCard";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Task } from "@/types";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/tasks/my");
        setActiveTasks(
          res.data.filter((t: Task) => ["active", "pending_acceptance", "proof_submitted"].includes(t.status))
        );
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user ? `, ${user.display_name}` : ""}
        </h1>
        <p className="text-muted-foreground">Here&apos;s your accountability overview</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <CoinBadge amount={user?.balance ?? 0} size="lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <StreakBadge streak={user?.current_streak ?? 0} />
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeTasks.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Tasks</h2>
          <Link href="/tasks/new">
            <Button size="sm">New Task</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : activeTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No active tasks. Ready to lock in?</p>
              <Link href="/tasks/new">
                <Button className="mt-3">Create your first task</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
