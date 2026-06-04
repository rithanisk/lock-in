"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Squad } from "@/types";
import api from "@/lib/api";
import Link from "next/link";

const squadColors = ["bg-accent/10 text-accent", "bg-violet-500/10 text-violet-400", "bg-sky-500/10 text-sky-400", "bg-rose-500/10 text-rose-400", "bg-emerald-500/10 text-emerald-400"];

export default function SquadsPage() {
  const router = useRouter();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try { const res = await api.get("/squads/my"); setSquads(res.data); }
      catch { /**/ } finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleCreate() {
    setActionLoading(true); setError("");
    try {
      const res = await api.post("/squads/", { name, description: description || null });
      setCreateOpen(false); router.push(`/squads/${res.data.id}`);
    } catch { setError("Failed to create crew"); } finally { setActionLoading(false); }
  }

  async function handleJoin() {
    setActionLoading(true); setError("");
    try {
      const res = await api.post("/squads/join", { invite_code: inviteCode });
      setJoinOpen(false); router.push(`/squads/${res.data.id}`);
    } catch { setError("Invalid code or crew is full"); } finally { setActionLoading(false); }
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Crews</h1>
        <div className="flex gap-2">
          <button onClick={() => setJoinOpen(true)}
            className="rounded-2xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors active:scale-95">
            Join
          </button>
          <button onClick={() => setCreateOpen(true)}
            className="rounded-2xl bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold active:scale-95 transition-transform">
            + New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-1.5">
          {[1, 2].map(i => <div key={i} className="rounded-xl bg-card border border-border/60 h-14 animate-pulse" />)}
        </div>
      ) : squads.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-14 text-center space-y-4">
          <p className="text-3xl">🏆</p>
          <p className="text-sm text-muted-foreground">You&apos;re not in any crews yet</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setJoinOpen(true)}
              className="rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
              Join a crew
            </button>
            <button onClick={() => setCreateOpen(true)}
              className="rounded-2xl bg-accent text-accent-foreground px-4 py-2.5 text-sm font-semibold active:scale-95 transition-transform">
              Create one
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {squads.map((squad, i) => (
            <Link key={squad.id} href={`/squads/${squad.id}`}>
              <div className="rounded-2xl bg-card card-shadow p-4 flex items-center justify-between active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold ${squadColors[i % squadColors.length]}`}>
                    {squad.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{squad.name}</p>
                    <p className="text-xs text-muted-foreground">{squad.member_count ?? 0} members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pot</p>
                  <p className="text-lg font-bold text-accent">{squad.pot_balance}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-3xl mx-4">
          <DialogHeader>
            <DialogTitle>Create Crew</DialogTitle>
            <DialogDescription>Start an accountability group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Crew name..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-foreground/20" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-foreground/20" />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button onClick={handleCreate} disabled={!name || actionLoading}
              className="w-full rounded-2xl bg-accent text-accent-foreground py-4 text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform">
              {actionLoading ? "Creating..." : "Create Crew"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="rounded-3xl mx-4">
          <DialogHeader>
            <DialogTitle>Join Crew</DialogTitle>
            <DialogDescription>Enter an invite code to join.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter code..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-foreground/20 font-mono"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button onClick={handleJoin} disabled={!inviteCode || actionLoading}
              className="w-full rounded-2xl bg-accent text-accent-foreground py-4 text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform">
              {actionLoading ? "Joining..." : "Join Crew"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
