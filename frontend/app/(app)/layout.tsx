"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { CoinBadge } from "@/components/custom/CoinBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "&#x1F3E0;" },
  { href: "/tasks", label: "Tasks", icon: "&#x2705;" },
  { href: "/squads", label: "Squads", icon: "&#x1F465;" },
  { href: "/notifications", label: "Alerts", icon: "&#x1F514;" },
  { href: "/profile", label: "Profile", icon: "&#x1F464;" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, loading, setLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function waitForAccessToken() {
      const supabase = createClient();
      const start = Date.now();
      const maxWaitMs = 8000;
      while (Date.now() - start < maxWaitMs) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) return;
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    async function loadUser() {
      try {
        await waitForAccessToken();
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch {
        // Not authenticated or API error (e.g. wrong JWT secret on backend)
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
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r flex-col bg-card">
        <div className="p-6">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            LockIn
          </Link>
        </div>

        {user && (
          <div className="px-6 pb-4">
            <CoinBadge amount={user.balance} size="md" />
          </div>
        )}

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span dangerouslySetInnerHTML={{ __html: item.icon }} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 text-xs transition-colors",
                pathname.startsWith(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <span className="text-lg" dangerouslySetInnerHTML={{ __html: item.icon }} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
