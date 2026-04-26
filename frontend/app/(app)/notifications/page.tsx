"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/custom/NotificationItem";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications(data ?? []);
      setLoading(false);
    }
    load();

    // Realtime
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({unreadCount} unread)
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-4 text-muted-foreground">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
          ))
        )}
      </Card>
    </div>
  );
}
