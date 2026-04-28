"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  if (!user) return null;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    router.refresh();
  }

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
        <div className="rounded-2xl bg-emerald-600 p-4 text-white">
          <p className="text-xs text-emerald-100 mb-1">Current Streak</p>
          <p className="text-2xl font-bold">{user.current_streak} days</p>
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

      <div className="md:hidden pt-2">
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
