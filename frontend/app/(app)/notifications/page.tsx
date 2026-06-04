"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Notification } from "@/types";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    async function load() {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
      setNotifications(data ?? []);
      setLoading(false);
    }
    load();
    const channel = supabase.channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          {unreadCount > 0 && (
            <span className="bg-accent text-accent-foreground text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-medium text-accent active:opacity-70 transition-opacity">
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded-2xl bg-card card-shadow h-16 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <p className="text-3xl mb-3">🔔</p>
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-card card-shadow overflow-hidden divide-y divide-border">
          {notifications.map((n) => {
            const item = (
              <div
                className={cn("flex gap-3 px-4 py-4 cursor-pointer transition-colors", !n.read ? "bg-accent/5" : "hover:bg-muted/40")}
                onClick={() => markRead(n.id)}
              >
                <div className="shrink-0 mt-1">
                  <div className={cn("w-2 h-2 rounded-full mt-0.5", n.read ? "bg-muted-foreground/20" : "bg-accent")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm leading-snug", !n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                </div>
              </div>
            );
            return n.link ? <Link key={n.id} href={n.link}>{item}</Link> : <div key={n.id}>{item}</div>;
          })}
        </div>
      )}
    </div>
  );
}
