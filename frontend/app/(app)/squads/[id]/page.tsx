"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SquadPotCard } from "@/components/custom/SquadPotCard";
import { CoinBadge } from "@/components/custom/CoinBadge";
import { Badge } from "@/components/ui/badge";
import type { Squad, SpendProposal, Friendship } from "@/types";
import api from "@/lib/api";

interface SquadMember {
  user_id: string;
  role: string;
  profiles: {
    display_name: string;
    balance: number;
    current_streak: number;
    longest_streak: number;
  };
}

export default function SquadDetailPage() {
  const params = useParams();
  const squadId = params.id as string;
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [proposals, setProposals] = useState<SpendProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [propTitle, setPropTitle] = useState("");
  const [propAmount, setPropAmount] = useState(5);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [squadRes, membersRes] = await Promise.all([
          api.get(`/squads/${squadId}`),
          api.get(`/squads/${squadId}/members`),
        ]);
        setSquad(squadRes.data);
        setMembers(membersRes.data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [squadId]);

  async function handlePropose() {
    setActionLoading(true);
    try {
      const res = await api.post(`/squads/${squadId}/spend`, {
        title: propTitle,
        amount: propAmount,
      });
      setProposals((prev) => [res.data, ...prev]);
      setProposeOpen(false);
      setPropTitle("");
      setPropAmount(5);
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  }

  async function openInviteDialog() {
    setInviteOpen(true);
    try {
      const res = await api.get("/friends");
      // Filter out users already in the squad
      const memberIds = new Set(members.map((m) => m.user_id));
      setFriends(res.data.filter((f: Friendship) => !memberIds.has(f.profile.id)));
    } catch {
      // handle error
    }
  }

  async function handleInvite(userId: string) {
    setActionLoading(true);
    try {
      await api.post(`/squads/${squadId}/invite`, { user_id: userId });
      setFriends((prev) => prev.filter((f) => f.profile.id !== userId));
      // Refresh members
      const membersRes = await api.get(`/squads/${squadId}/members`);
      setMembers(membersRes.data);
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVote(proposalId: string, vote: boolean) {
    try {
      await api.post(`/squads/${squadId}/vote`, { proposal_id: proposalId, vote });
    } catch {
      // handle error
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!squad) return <p className="text-destructive">Squad not found.</p>;

  // Sort members by streak for leaderboard
  const leaderboard = [...members].sort(
    (a, b) => b.profiles.current_streak - a.profiles.current_streak
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{squad.name}</h1>
        {squad.description && (
          <p className="text-muted-foreground mt-1">{squad.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          Invite code: <code className="bg-muted px-2 py-0.5 rounded">{squad.invite_code}</code>
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="rounded-xl" onClick={openInviteDialog}>
          Invite Friend
        </Button>
      </div>

      <SquadPotCard potBalance={squad.pot_balance} memberCount={squad.member_count} />

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <div className="space-y-2">
            {leaderboard.map((m, i) => (
              <Card key={m.user_id}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{m.profiles.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Streak: {m.profiles.current_streak} | Best: {m.profiles.longest_streak}
                      </p>
                    </div>
                  </div>
                  {m.role === "admin" && <Badge variant="secondary">Admin</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="proposals" className="mt-4 space-y-4">
          <Button onClick={() => setProposeOpen(true)} size="sm">
            New Proposal
          </Button>

          {proposals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No proposals yet.</p>
          ) : (
            proposals.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <Badge variant={p.status === "approved" ? "default" : p.status === "rejected" ? "destructive" : "outline"}>
                      {p.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <CoinBadge amount={p.amount} size="sm" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">{p.votes_for} for</span>
                    <span className="text-destructive">{p.votes_against} against</span>
                  </div>
                  {p.status === "open" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleVote(p.id, false)}>
                        Nay
                      </Button>
                      <Button size="sm" onClick={() => handleVote(p.id, true)}>
                        Yea
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={proposeOpen} onOpenChange={setProposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propose Spend</DialogTitle>
            <DialogDescription>Propose how to spend from the squad pot.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What for?</Label>
              <Input value={propTitle} onChange={(e) => setPropTitle(e.target.value)} placeholder="e.g., Pizza party" />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min={1} max={squad.pot_balance} value={propAmount} onChange={(e) => setPropAmount(Number(e.target.value))} />
            </div>
            <Button className="w-full" onClick={handlePropose} disabled={!propTitle || actionLoading}>
              {actionLoading ? "Submitting..." : "Submit Proposal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Friend</DialogTitle>
            <DialogDescription>Add a friend to this crew.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friends available to invite.</p>
            ) : (
              friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {f.profile.display_name.charAt(0)}
                    </div>
                    <span className="font-medium text-sm">{f.profile.display_name}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleInvite(f.profile.id)}
                    disabled={actionLoading}
                  >
                    Invite
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
