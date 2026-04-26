"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CoinBadge } from "@/components/custom/CoinBadge";
import type { Squad } from "@/types";
import api from "@/lib/api";
import Link from "next/link";

export default function SquadsPage() {
  const router = useRouter();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Join form
  const [inviteCode, setInviteCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSquads();
  }, []);

  async function loadSquads() {
    try {
      const res = await api.get("/squads/my");
      setSquads(res.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setActionLoading(true);
    setError("");
    try {
      const res = await api.post("/squads/", { name, description: description || null });
      setCreateOpen(false);
      router.push(`/squads/${res.data.id}`);
    } catch {
      setError("Failed to create squad");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoin() {
    setActionLoading(true);
    setError("");
    try {
      const res = await api.post("/squads/join", { invite_code: inviteCode });
      setJoinOpen(false);
      router.push(`/squads/${res.data.id}`);
    } catch {
      setError("Invalid invite code or squad is full");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Squads</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJoinOpen(true)}>
            Join
          </Button>
          <Button onClick={() => setCreateOpen(true)}>Create</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : squads.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>You&apos;re not in any squads yet.</p>
            <div className="flex gap-2 justify-center mt-3">
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                Join a squad
              </Button>
              <Button onClick={() => setCreateOpen(true)}>Create one</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {squads.map((squad) => (
            <Link key={squad.id} href={`/squads/${squad.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{squad.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <CoinBadge amount={squad.pot_balance} size="sm" />
                  <span className="text-sm text-muted-foreground">
                    {squad.member_count ?? "?"} members
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Squad</DialogTitle>
            <DialogDescription>Create an accountability group with friends.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Squad Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., CS Study Group" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleCreate} disabled={!name || actionLoading}>
              {actionLoading ? "Creating..." : "Create Squad"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Squad</DialogTitle>
            <DialogDescription>Enter an invite code to join.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter code..." />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleJoin} disabled={!inviteCode || actionLoading}>
              {actionLoading ? "Joining..." : "Join Squad"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
