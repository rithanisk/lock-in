"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { Friendship, UserSummary } from "@/types";

const categories = [
  { value: "study", label: "Study" },
  { value: "fitness", label: "Fitness" },
  { value: "wellness", label: "Wellness" },
  { value: "productivity", label: "Productive" },
  { value: "social", label: "Social" },
  { value: "custom", label: "Other" },
];

const stakePresets = [1, 5, 10, 25, 50];

export default function NewTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");
  const [stakeAmount, setStakeAmount] = useState(5);
  const [proofType, setProofType] = useState("photo");
  const [deadline, setDeadline] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [selectedVerifier, setSelectedVerifier] = useState<UserSummary | null>(null);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendsLoaded, setFriendsLoaded] = useState(false);

  useEffect(() => {
    if (step === 3 && !friendsLoaded) {
      api.get("/friends").then((res) => setFriends(res.data)).catch(() => {});
      setFriendsLoaded(true);
    }
  }, [step, friendsLoaded]);

  async function searchUsers(q: string) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch { /* */ }
  }

  async function handleSubmit() {
    if (!selectedVerifier) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/tasks/", {
        title,
        description: description || null,
        category,
        stake_amount: stakeAmount,
        verifier_id: selectedVerifier.id,
        deadline: new Date(deadline).toISOString(),
        proof_type: proofType,
      });
      router.push("/tasks");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || "Failed to create stake");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Stake</h1>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              s <= step ? "bg-gray-900" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">What&apos;s the task?</Label>
            <Input
              placeholder="e.g., Complete Chapter 5 Problems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Description (optional)</Label>
            <Textarea
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "rounded-xl border py-2.5 text-sm font-medium transition-colors",
                    category === c.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Deadline</Label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Proof type</Label>
            <div className="flex gap-2">
              {[
                { value: "photo", label: "Photo" },
                { value: "text", label: "Text" },
                { value: "both", label: "Both" },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProofType(p.value)}
                  className={cn(
                    "flex-1 rounded-xl border py-2 text-sm font-medium transition-colors",
                    proofType === p.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!title || !deadline}
            className="w-full rounded-xl bg-gray-900 text-white font-medium py-2.5 text-sm hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Stake Amount */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">How much are you putting on the line?</p>
            <p className="text-5xl font-bold text-accent">${stakeAmount}</p>
          </div>

          <div className="flex gap-2 justify-center">
            {stakePresets.map((v) => (
              <button
                key={v}
                onClick={() => setStakeAmount(v)}
                className={cn(
                  "w-14 h-14 rounded-xl border text-sm font-semibold transition-colors",
                  stakeAmount === v
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-border hover:bg-muted"
                )}
              >
                ${v}
              </button>
            ))}
          </div>

          <input
            type="range"
            min={1}
            max={50}
            value={stakeAmount}
            onChange={(e) => setStakeAmount(Number(e.target.value))}
            className="w-full accent-gray-900"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 rounded-xl bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Verifier */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose your verifier</Label>
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => searchUsers(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="rounded-xl border divide-y max-h-48 overflow-y-auto">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                  onClick={() => {
                    setSelectedVerifier(u);
                    setSearchResults([]);
                    setSearchQuery(u.display_name);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {u.display_name.charAt(0)}
                  </div>
                  <span className="font-medium text-sm">{u.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Friends list (shown when not searching) */}
          {searchQuery.length < 2 && !selectedVerifier && friends.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your Friends</p>
              <div className="rounded-xl border divide-y max-h-48 overflow-y-auto">
                {friends.map((f) => (
                  <button
                    key={f.id}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                    onClick={() => {
                      setSelectedVerifier(f.profile);
                      setSearchQuery(f.profile.display_name);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {f.profile.display_name.charAt(0)}
                    </div>
                    <span className="font-medium text-sm">{f.profile.display_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVerifier && (
            <div className="rounded-xl bg-emerald-50 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold">
                {selectedVerifier.display_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold">{selectedVerifier.display_name}</p>
                <p className="text-xs text-muted-foreground">Will verify your task</p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedVerifier || loading}
              className="flex-1 rounded-xl bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {loading ? "Creating..." : `Stake $${stakeAmount}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
