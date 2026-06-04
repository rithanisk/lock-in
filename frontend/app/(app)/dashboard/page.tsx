"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { TaskCard } from "@/components/custom/TaskCard";
import type { Task, Squad } from "@/types";
import api from "@/lib/api";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const { user, alertsUnreadCount } = useAuthStore();
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
        if (user) {
          const supabase = createClient();
          const { data } = await supabase.from("tasks").select("*").eq("creator_id", user.id)
            .in("status", ["active", "pending_acceptance", "proof_submitted"]).order("created_at", { ascending: false });
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
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">Hi, {firstName}</h1>
        <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center card-shadow">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {alertsUnreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent border-2 border-background flex items-center justify-center">
              <span className="text-[9px] font-bold text-accent-foreground leading-none">{alertsUnreadCount > 9 ? "9+" : alertsUnreadCount}</span>
            </span>
          )}
        </Link>
      </div>

      {/* Balance Hero */}
      <div className="relative">
        {/* Ambient glow behind the card */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/25 via-accent/5 to-violet-500/15 blur-2xl scale-105 -z-10" />

        {/* Frosted glass card */}
        <div
          className="rounded-3xl border border-white/10 p-6 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)" }}
        >
          {/* Inner top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-foreground/35 mb-3">LockCoin Balance</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="font-number text-6xl font-bold tracking-tight text-accent leading-none">
              {user?.balance ?? 0}
            </span>
            <span className="font-number text-lg font-medium text-foreground/30 mb-1">LC</span>
          </div>

          {(user?.current_streak ?? 0) > 0 ? (
            <div className="inline-flex items-center gap-1.5 bg-white/6 rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-xs">🔥</span>
              <span className="font-number text-xs text-foreground/55 font-medium">{user?.current_streak} day streak</span>
            </div>
          ) : (
            <span className="text-xs text-foreground/25">No active streak</span>
          )}

          <div className="flex gap-2.5 mt-5">
            <Link href="/tasks/new" className="flex-1">
              <button className="w-full rounded-2xl bg-accent text-accent-foreground font-semibold py-3 text-sm active:scale-[0.97] transition-transform">
                + New Stake
              </button>
            </Link>
            <Link href="/tasks" className="flex-1">
              <button className="w-full rounded-2xl border border-white/12 text-foreground/60 font-medium py-3 text-sm active:scale-[0.97] transition-transform"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                My Stakes
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Stakes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Active Stakes</h2>
          <Link href="/tasks" className="text-xs text-accent font-medium">See all</Link>
        </div>
        {loading ? (
          <div className="flex flex-col gap-1.5">
            {[1, 2].map(i => <div key={i} className="rounded-xl bg-card border border-border h-14 animate-pulse" />)}
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 py-10 text-center">
            <p className="text-muted-foreground text-sm mb-4">No active stakes yet</p>
            <Link href="/tasks/new">
              <button className="rounded-xl bg-accent text-accent-foreground px-5 py-2.5 text-sm font-semibold active:scale-95 transition-transform">
                Create your first stake
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {activeTasks.slice(0, 3).map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        )}
      </div>

      {/* Crews */}
      {squads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Your Crews</h2>
            <Link href="/squads" className="text-xs text-accent font-medium">See all</Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {squads.slice(0, 3).map((squad, i) => {
              const colors = [
                "bg-accent/15 text-accent",
                "bg-violet-500/15 text-violet-400",
                "bg-sky-500/15 text-sky-400",
              ];
              return (
                <Link key={squad.id} href={`/squads/${squad.id}`}>
                  <div className="rounded-xl bg-card border border-border px-3.5 py-3 flex items-center gap-3 active:scale-[0.99] transition-transform card-shadow">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${colors[i % colors.length]}`}>
                      {squad.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{squad.name}</p>
                      <p className="text-xs text-muted-foreground">{squad.member_count ?? 0} members</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Pot</p>
                      <p className="font-number text-base font-bold text-accent">{squad.pot_balance}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {squads.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-border/50 py-8 text-center">
          <p className="text-muted-foreground text-sm mb-3">Join a crew for group accountability</p>
          <Link href="/squads">
            <button className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-card transition-colors">
              Browse Crews
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
