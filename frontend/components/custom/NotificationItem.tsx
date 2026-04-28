"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const content = (
    <div
      className={cn(
        "p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer",
        !notification.read && "bg-primary/5"
      )}
      onClick={() => onMarkRead?.(notification.id)}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            notification.read ? "bg-muted-foreground/25" : "bg-sky-500",
          )}
          aria-hidden
        />
        <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <p className={cn("text-sm", !notification.read && "font-semibold")}>
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{notification.body}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </span>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }
  return content;
}
