"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { TaskCard } from "@/components/custom/TaskCard";
import { StreakBadge } from "@/components/custom/StreakBadge";
import type { Task, Squad } from "@/types";
import api from "@/lib/api";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tasksRes, squadsRes] = await Promise.all([
          api.get("/tasks/my").catch(() => ({ data: [] })),
          api.get("/squads/my").catch(() => ({ data: [] })),
        ]);
        setActiveTasks(
          tasksRes.data.filter((t: Task) =>
            ["active", "pending_acceptance", "proof_submitted"].includes(t.status)
          )
        );
        setSquads(squadsRes.data);
      } catch {
        // Fallback: load tasks from Supabase directly
        if (user) {
          const supabase = createClient();
          const { data } = await supabase
            .from("tasks")
            .select("*")
            .eq("creator_id", user.id)
            .in("status", ["active", "pending_acceptance", "proof_submitted"])
            .order("created_at", { ascending: false });
          if (data) setActiveTasks(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const firstName = user?.display_name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Hey {firstName}
        </h1>
        <p className="text-muted-foreground">Ready to crush your goals?</p>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl bg-gray-900 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Balance</p>
            <p className="text-4xl font-bold tracking-tight">
              ${(user?.balance ?? 0).toFixed(2)}
            </p>
            <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Active &amp; earning
            </p>
          </div>
          <StreakBadge streak={user?.current_streak ?? 0} />
        </div>

        <div className="flex gap-3 mt-5">
          <Link href="/profile" className="flex-1">
            <button className="w-full rounded-xl bg-white text-gray-900 font-medium py-2.5 text-sm hover:bg-gray-100 transition-colors">
              Cash Out
            </button>
          </Link>
          <Link href="/tasks/new" className="flex-1">
            <button className="w-full rounded-xl border border-gray-600 text-white font-medium py-2.5 text-sm hover:bg-gray-800 transition-colors">
              + Stake
            </button>
          </Link>
        </div>
      </div>

      {/* Active Stakes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Active Stakes</h2>
          <Link href="/tasks" className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : activeTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center">
            <p className="text-muted-foreground mb-3">No active stakes yet</p>
            <Link href="/tasks/new">
              <button className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                + Create your first stake
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Your Crews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Your Crews</h2>
          <Link href="/squads" className="text-sm font-medium text-accent hover:underline">
            + New Crew
          </Link>
        </div>

        {squads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-8 text-center">
            <p className="text-muted-foreground">Join or create a crew to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {squads.map((squad) => (
              <Link key={squad.id} href={`/squads/${squad.id}`}>
                <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-700">
                      {squad.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{squad.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {squad.member_count ?? 0} members
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Crew Pot</p>
                    <p className="text-xl font-bold text-accent">${squad.pot_balance}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
