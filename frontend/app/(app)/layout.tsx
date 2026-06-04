"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        {active && <polyline points="9 22 9 12 15 12 15 22" fill="none" />}
        {!active && <polyline points="9 22 9 12 15 12 15 22" />}
      </svg>
    ),
  },
  {
    href: "/tasks",
    label: "Stakes",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth={active ? "2.2" : "1.8"} />
      </svg>
    ),
  },
  {
    href: "/squads",
    label: "Crews",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, loading, setLoading, alertsUnreadCount, setAlertsUnreadCount } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadUser() {
      const supabase = createClient();
      let session = null;
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) { session = data.session; break; }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!session) { setLoading(false); return; }
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (profile) setUser(profile);
      } finally { setLoading(false); }
    }
    loadUser();
  }, [setUser, setLoading]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      setAlertsUnreadCount(0);
      return;
    }
    const supabase = createClient();
    async function refreshUnread() {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      setAlertsUnreadCount(count ?? 0);
    }
    refreshUnread();
    const channel = supabase
      .channel(`layout-notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => refreshUnread(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, setAlertsUnreadCount]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border flex-col bg-card shrink-0">
        <div className="p-6 pb-5">
          <Link href="/dashboard" className="font-display text-xl font-bold tracking-tight text-foreground">
            Lock<span className="text-accent">In</span>
          </Link>
        </div>

        {user && (
          <div className="px-4 pb-4">
            <div className="rounded-2xl bg-foreground px-4 py-3.5 text-background">
              <p className="text-[10px] font-medium tracking-widest uppercase opacity-40 mb-1">Balance</p>
              <p className="font-number text-2xl font-bold text-accent leading-none">{user.balance}<span className="text-sm font-normal text-background/40 ml-1">LC</span></p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  active ? "bg-accent/10 text-accent font-medium border border-accent/15" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="relative shrink-0">{item.icon(active)}</span>
                {item.label}
              </Link>
            );
          })}
          {/* Alerts — desktop sidebar only */}
          <Link href="/notifications"
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
              pathname.startsWith("/notifications") ? "bg-accent/10 text-accent font-medium border border-accent/15" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="relative shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill={pathname.startsWith("/notifications") ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {alertsUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent border border-card" />
              )}
            </span>
            Alerts
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <button onClick={handleSignOut}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
        <div className="max-w-lg mx-auto px-4 py-5 md:max-w-2xl md:px-8 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border" style={{ backdropFilter: "blur(20px)" }}>
        <div className="flex justify-around items-stretch" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}>
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn("relative flex flex-col items-center justify-center gap-1 pt-3 pb-1 px-3 transition-colors",
                  active ? "text-accent" : "text-muted-foreground"
                )}
              >
                <span className="relative">
                  {item.icon(active)}
                </span>
                <span className="text-[9px] font-medium leading-none tracking-wide">
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* FAB - New Stake */}
      {!pathname.startsWith("/tasks/new") && (
        <Link href="/tasks/new"
          className="md:hidden fixed bottom-[calc(72px+env(safe-area-inset-bottom)+14px)] right-4 z-40 w-12 h-12 bg-accent text-accent-foreground rounded-2xl flex items-center justify-center card-shadow-md active:scale-95 transition-transform"
          aria-label="New Stake"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      )}
    </div>
  );
}
