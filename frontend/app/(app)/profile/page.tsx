"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { createClient } from "@/lib/supabase/client";

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

  const initial = user.display_name.charAt(0).toUpperCase();

  return (
    <div className="space-y-4 pb-4 relative z-10">
      {/* Hero */}
      <div className="rounded-3xl bg-foreground p-6 text-background relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-background/10 border border-background/15 flex items-center justify-center font-display text-2xl font-bold text-background shrink-0">
            {initial}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{user.display_name}</h1>
            {user.university && <p className="text-sm opacity-50 mt-0.5">{user.university}</p>}
            <p className="text-xs opacity-30 mt-0.5">
              Joined {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-card border border-border card-shadow p-4">
          <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground mb-2">Balance</p>
          <p className="font-number text-2xl font-bold text-accent">{user.balance}<span className="text-sm font-normal text-muted-foreground ml-1">LC</span></p>
        </div>
        <div className="rounded-2xl bg-card border border-border card-shadow p-4">
          <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground mb-2">Streak</p>
          <p className="font-number text-2xl font-bold text-emerald-400">{user.current_streak}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
        </div>
        <div className="rounded-2xl bg-card border border-border card-shadow p-4 col-span-2">
          <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground mb-2">Best Streak</p>
          <div className="flex items-end gap-2 mb-3">
            <p className="font-number text-2xl font-bold">{user.longest_streak}</p>
            <p className="text-sm text-muted-foreground mb-0.5">days — personal best</p>
          </div>
          {user.longest_streak > 0 && (
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${Math.min((user.current_streak / user.longest_streak) * 100, 100)}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl bg-card border border-border card-shadow overflow-hidden divide-y divide-border">
        <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted transition-colors text-left">
          <span className="text-sm font-medium">Edit Profile</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted transition-colors text-left">
          <span className="text-sm font-medium">Notifications</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <button onClick={handleSignOut}
        className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 py-4 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors active:scale-[0.98]">
        Sign out
      </button>
    </div>
  );
}
