"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Squad } from "@/types";
import api from "@/lib/api";
import Link from "next/link";

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
      try {
        const res = await api.get("/squads/my");
        setSquads(res.data);
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleCreate() {
    setActionLoading(true);
    setError("");
    try {
      const res = await api.post("/squads/", { name, description: description || null });
      setCreateOpen(false);
      router.push(`/squads/${res.data.id}`);
    } catch { setError("Failed to create crew"); }
    finally { setActionLoading(false); }
  }

  async function handleJoin() {
    setActionLoading(true);
    setError("");
    try {
      const res = await api.post("/squads/join", { invite_code: inviteCode });
      setJoinOpen(false);
      router.push(`/squads/${res.data.id}`);
    } catch { setError("Invalid code or crew is full"); }
    finally { setActionLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Crews</h1>
        <div className="flex gap-2">
          <button onClick={() => setJoinOpen(true)}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Join
          </button>
          <button onClick={() => setCreateOpen(true)}
            className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
            + New Crew
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : squads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground mb-4">You&apos;re not in any crews yet</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setJoinOpen(true)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
              Join a crew
            </button>
            <button onClick={() => setCreateOpen(true)}
              className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
              Create one
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {squads.map((squad) => (
            <Link key={squad.id} href={`/squads/${squad.id}`}>
              <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">
                    &#x1F525;
                  </div>
                  <div>
                    <p className="font-semibold">{squad.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {squad.member_count ?? 0} members active
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Crew Pot</p>
                  <p className="text-xl font-bold text-accent">${squad.pot_balance}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create Crew</DialogTitle>
            <DialogDescription>Start an accountability group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Crew Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Finals Grind" className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description (optional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl h-11" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button onClick={handleCreate} disabled={!name || actionLoading}
              className="w-full rounded-xl bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40">
              {actionLoading ? "Creating..." : "Create Crew"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Join Crew</DialogTitle>
            <DialogDescription>Enter an invite code.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Invite Code</Label>
              <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter code..." className="rounded-xl h-11" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button onClick={handleJoin} disabled={!inviteCode || actionLoading}
              className="w-full rounded-xl bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40">
              {actionLoading ? "Joining..." : "Join Crew"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
