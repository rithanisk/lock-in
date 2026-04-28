"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        const [friendsRes, requestsRes] = await Promise.all([
          api.get("/friends"),
          api.get("/friends/requests"),
        ]);
        setFriends(friendsRes.data);
        setRequests(requestsRes.data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Set of IDs we should exclude from search results
  const excludedIds = new Set([
    ...friends.map((f) => f.profile.id),
    ...requests.map((r) => r.profile.id),
    ...sentRequests.map((u) => u.id),
  ]);

  async function searchUsers(q: string) {
    setSearchQuery(q);
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.filter((u: UserSummary) => !excludedIds.has(u.id)));
    } catch {
      // handle error
    }
  }

  async function sendRequest(userToAdd: UserSummary) {
    setActionLoading(userToAdd.id);
    try {
      await api.post(`/friends/${userToAdd.id}`);
      // Move from search results to sent requests
      setSearchResults((prev) => prev.filter((u) => u.id !== userToAdd.id));
      setSentRequests((prev) => [userToAdd, ...prev]);
    } catch (err) {
      console.error("Failed to send friend request:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function respondToRequest(friendshipId: string, action: "accept" | "decline") {
    setActionLoading(friendshipId);
    try {
      const res = await api.put(`/friends/${friendshipId}`, { action });
      setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
      if (action === "accept") {
        setFriends((prev) => [res.data, ...prev]);
      }
    } catch {
      // handle error
    } finally {
      setActionLoading(null);
    }
  }

  async function removeFriend(friendshipId: string) {
    setActionLoading(friendshipId);
    try {
      await api.delete(`/friends/${friendshipId}`);
      setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
    } catch {
      // handle error
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Friends</h1>

      {/* Search & Add */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Add Friends</h2>
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => searchUsers(e.target.value)}
          className="rounded-xl h-11"
        />
        {searchResults.length > 0 && (
          <div className="rounded-2xl border divide-y overflow-hidden">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {u.display_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.display_name}</p>
                    {u.university && (
                      <p className="text-xs text-muted-foreground">{u.university}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl bg-gray-900 text-white hover:bg-gray-800"
                  onClick={() => sendRequest(u)}
                  disabled={actionLoading === u.id}
                >
                  {actionLoading === u.id ? "Sending..." : "Add"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending (Sent Requests) */}
      {sentRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Pending ({sentRequests.length})
          </h2>
          <div className="space-y-2">
            {sentRequests.map((u) => (
              <Card key={u.id} className="rounded-2xl">
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                      {u.display_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground">Request sent</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Pending</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Requests */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Requests ({requests.length})
          </h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <Card key={r.id} className="rounded-2xl">
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                      {r.profile.display_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.profile.display_name}</p>
                      <p className="text-xs text-muted-foreground">Wants to be friends</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => respondToRequest(r.id, "decline")}
                      disabled={actionLoading === r.id}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl bg-gray-900 text-white hover:bg-gray-800"
                      onClick={() => respondToRequest(r.id, "accept")}
                      disabled={actionLoading === r.id}
                    >
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Your Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">No friends yet. Search above to add some!</p>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <Card key={f.id} className="rounded-2xl">
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {f.profile.display_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{f.profile.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Streak: {f.profile.current_streak} | Best: {f.profile.longest_streak}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeFriend(f.id)}
                    disabled={actionLoading === f.id}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
