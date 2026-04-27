"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/tasks",
    label: "Stakes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/squads",
    label: "Crews",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/notifications",
    label: "Alerts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, loading, setLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadUser() {
      const supabase = createClient();

      let session = null;
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          session = data.session;
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profile) setUser(profile);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [setUser, setLoading]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r flex-col bg-card">
        <div className="p-6">
          <Link href="/dashboard" className="text-2xl font-bold text-foreground">
            LockIn
          </Link>
        </div>

        {user && (
          <div className="px-6 pb-4">
            <div className="rounded-xl bg-gray-900 px-4 py-3 text-white">
              <p className="text-xs text-gray-400">Balance</p>
              <p className="text-xl font-bold">${user.balance.toFixed(2)}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-gray-900 text-white font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-xl mx-auto px-5 py-6 md:max-w-2xl md:px-8 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm z-50 safe-area-pb">
        <div className="flex justify-around py-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 text-[10px] transition-colors",
                pathname.startsWith(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span className={cn(
                "mb-0.5",
                pathname.startsWith(item.href) && "text-accent"
              )}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
