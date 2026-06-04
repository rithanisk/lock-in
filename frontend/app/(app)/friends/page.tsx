"use client";

import { useEffect, useState } from "react";
import type { Friendship, UserSummary } from "@/types";
import api from "@/lib/api";

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [friendsRes, requestsRes] = await Promise.all([api.get("/friends"), api.get("/friends/requests")]);
        setFriends(friendsRes.data);
        setRequests(requestsRes.data);
      } catch { /**/ } finally { setLoading(false); }
    }
    load();
  }, []);

  const excludedIds = new Set([...friends.map((f) => f.profile.id), ...requests.map((r) => r.profile.id), ...sentRequests.map((u) => u.id)]);

  async function searchUsers(q: string) {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.filter((u: UserSummary) => !excludedIds.has(u.id)));
    } catch { /**/ }
  }

  async function sendRequest(u: UserSummary) {
    setActionLoading(u.id);
    try {
      await api.post(`/friends/${u.id}`);
      setSearchResults((prev) => prev.filter((x) => x.id !== u.id));
      setSentRequests((prev) => [u, ...prev]);
    } catch { /**/ } finally { setActionLoading(null); }
  }

  async function respond(friendshipId: string, action: "accept" | "decline") {
    setActionLoading(friendshipId);
    try {
      const res = await api.put(`/friends/${friendshipId}`, { action });
      setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
      if (action === "accept") setFriends((prev) => [res.data, ...prev]);
    } catch { /**/ } finally { setActionLoading(null); }
  }

  async function removeFriend(friendshipId: string) {
    setActionLoading(friendshipId);
    try {
      await api.delete(`/friends/${friendshipId}`);
      setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
    } catch { /**/ } finally { setActionLoading(null); }
  }

  if (loading) return (
    <div className="space-y-3 pt-4">
      {[1, 2, 3].map(i => <div key={i} className="rounded-2xl bg-card card-shadow h-16 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6 pb-4">
      <h1 className="text-2xl font-bold tracking-tight">Friends</h1>

      {/* Search */}
      <div className="space-y-3">
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search people..." value={searchQuery} onChange={(e) => searchUsers(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="rounded-2xl bg-card card-shadow overflow-hidden divide-y divide-border">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/15 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {u.display_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{u.display_name}</p>
                    {u.university && <p className="text-xs text-muted-foreground">{u.university}</p>}
                  </div>
                </div>
                <button onClick={() => sendRequest(u)} disabled={actionLoading === u.id}
                  className="rounded-xl bg-accent text-accent-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50 active:scale-95 transition-transform">
                  {actionLoading === u.id ? "..." : "Add"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending sent */}
      {sentRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending ({sentRequests.length})</p>
          <div className="rounded-2xl bg-card card-shadow overflow-hidden divide-y divide-border">
            {sentRequests.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-sm font-bold text-amber-400 shrink-0">
                    {u.display_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">Request sent</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming requests */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Requests ({requests.length})</p>
          <div className="rounded-2xl bg-card card-shadow overflow-hidden divide-y divide-border">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sky-500/10 border border-sky-500/15 flex items-center justify-center text-sm font-bold text-sky-400 shrink-0">
                    {r.profile.display_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.profile.display_name}</p>
                    <p className="text-xs text-muted-foreground">Wants to connect</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(r.id, "decline")} disabled={actionLoading === r.id}
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50 transition-colors">
                    Decline
                  </button>
                  <button onClick={() => respond(r.id, "accept")} disabled={actionLoading === r.id}
                    className="rounded-xl bg-accent text-accent-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50 active:scale-95 transition-transform">
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Friends {friends.length > 0 ? `(${friends.length})` : ""}
        </p>
        {friends.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">No friends yet — search above to add some!</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card card-shadow overflow-hidden divide-y divide-border">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/15 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {f.profile.display_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.profile.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.profile.current_streak > 0 ? `🔥 ${f.profile.current_streak} day streak` : "No active streak"}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeFriend(f.id)} disabled={actionLoading === f.id}
                  className="text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50 p-2">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
