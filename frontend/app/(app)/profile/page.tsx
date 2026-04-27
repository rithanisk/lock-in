"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { StreakBadge } from "@/components/custom/StreakBadge";

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-2xl font-bold text-white">
          {user.display_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold">{user.display_name}</h2>
          {user.university && (
            <p className="text-sm text-muted-foreground">{user.university}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gray-900 p-4 text-white">
          <p className="text-xs text-gray-400 mb-1">Balance</p>
          <p className="text-2xl font-bold">${user.balance.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
          <StreakBadge streak={user.current_streak} />
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Best Streak</p>
          <p className="text-xl font-bold">{user.longest_streak} days</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Member since</p>
          <p className="text-sm font-semibold">
            {user.created_at
              ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
