"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { Friendship, UserSummary } from "@/types";
import Link from "next/link";

const categories = [
  { value: "study",        label: "Study",      emoji: "📚" },
  { value: "fitness",      label: "Fitness",    emoji: "🏋️" },
  { value: "wellness",     label: "Wellness",   emoji: "🧘" },
  { value: "productivity", label: "Productive", emoji: "⚡" },
  { value: "social",       label: "Social",     emoji: "🤝" },
  { value: "custom",       label: "Other",      emoji: "✨" },
];

const stakePresets = [5, 10, 25, 50];

export default function NewTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");
  const [stakeAmount, setStakeAmount] = useState(10);
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
    } catch { /**/ }
  }

  async function handleSubmit() {
    if (!selectedVerifier) return;
    setError(""); setLoading(true);
    try {
      await api.post("/tasks/", {
        title, description: description || null, category,
        stake_amount: stakeAmount,
        verifier_id: selectedVerifier.id,
        deadline: new Date(deadline).toISOString(),
        proof_type: proofType,
      });
      router.push("/tasks");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail || "Failed to create stake");
    } finally { setLoading(false); }
  }

  const stepLabels = ["Task", "Stake", "Verifier"];

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/tasks">
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </Link>
        <h1 className="text-xl font-bold tracking-tight">New Stake</h1>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => {
          const s = i + 1;
          const done = s < step;
          const active = s === step;
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  done ? "bg-emerald-500 text-white" : active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                )}>
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : s}
                </div>
                <span className={cn("text-xs font-medium hidden sm:block", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              </div>
              {s < 3 && <div className={cn("h-px flex-1 transition-colors", done ? "bg-emerald-500" : "bg-border")} />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold">What&apos;s the task?</label>
            <input
              placeholder="e.g., Complete Chapter 5 problems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
            <textarea
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={cn("rounded-2xl border py-3 text-sm font-medium flex flex-col items-center gap-1 transition-all active:scale-95",
                    category === c.value ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <span className="text-lg">{c.emoji}</span>
                  <span className={cn("text-xs", category === c.value ? "text-background" : "")}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Proof type</label>
            <div className="flex gap-2">
              {[{ value: "photo", label: "📸 Photo" }, { value: "text", label: "✍️ Text" }, { value: "both", label: "Both" }].map((p) => (
                <button key={p.value} onClick={() => setProofType(p.value)}
                  className={cn("flex-1 rounded-2xl border py-3 text-sm font-medium transition-all active:scale-95",
                    proofType === p.value ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setStep(2)} disabled={!title || !deadline}
            className="w-full rounded-2xl bg-foreground text-background font-semibold py-4 text-sm disabled:opacity-40 active:scale-[0.98] transition-transform mt-2">
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Stake Amount */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-foreground p-8 text-background text-center">
            <p className="text-sm opacity-50 mb-1">Staking</p>
            <p className="text-6xl font-bold tracking-tight">{stakeAmount}</p>
            <p className="text-sm opacity-50 mt-1">LockCoins</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {stakePresets.map((v) => (
              <button key={v} onClick={() => setStakeAmount(v)}
                className={cn("h-14 rounded-2xl border text-sm font-bold transition-all active:scale-95",
                  stakeAmount === v ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <input type="range" min={1} max={50} value={stakeAmount}
              onChange={(e) => setStakeAmount(Number(e.target.value))}
              className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-md"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span><span>50</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            You&apos;ll lose <span className="font-semibold text-foreground">{stakeAmount} LockCoins</span> if you don&apos;t complete this.
          </p>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 rounded-2xl border border-border bg-card py-4 text-sm font-semibold hover:bg-muted transition-colors active:scale-95">
              Back
            </button>
            <button onClick={() => setStep(3)}
              className="flex-1 rounded-2xl bg-foreground text-background py-4 text-sm font-semibold active:scale-[0.98] transition-transform">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Verifier */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Who&apos;s your verifier?</label>
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search by name..." value={searchQuery} onChange={(e) => searchUsers(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
              />
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="rounded-2xl border border-border overflow-hidden bg-card card-shadow divide-y divide-border">
              {searchResults.map((u) => (
                <button key={u.id} className="w-full text-left px-4 py-3.5 hover:bg-muted transition-colors flex items-center gap-3 active:bg-muted"
                  onClick={() => { setSelectedVerifier(u); setSearchResults([]); setSearchQuery(u.display_name); }}>
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                    {u.display_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{u.display_name}</p>
                    {u.university && <p className="text-xs text-muted-foreground">{u.university}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery.length < 2 && !selectedVerifier && friends.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Friends</p>
              <div className="rounded-2xl border border-border overflow-hidden bg-card card-shadow divide-y divide-border">
                {friends.map((f) => (
                  <button key={f.id} className="w-full text-left px-4 py-3.5 hover:bg-muted transition-colors flex items-center gap-3 active:bg-muted"
                    onClick={() => { setSelectedVerifier(f.profile); setSearchQuery(f.profile.display_name); }}>
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                      {f.profile.display_name.charAt(0)}
                    </div>
                    <p className="font-semibold text-sm">{f.profile.display_name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVerifier && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-sm font-bold text-emerald-800 shrink-0">
                {selectedVerifier.display_name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{selectedVerifier.display_name}</p>
                <p className="text-xs text-muted-foreground">Will verify your task</p>
              </div>
              <button onClick={() => { setSelectedVerifier(null); setSearchQuery(""); }}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => setStep(2)}
              className="flex-1 rounded-2xl border border-border bg-card py-4 text-sm font-semibold hover:bg-muted transition-colors active:scale-95">
              Back
            </button>
            <button onClick={handleSubmit} disabled={!selectedVerifier || loading}
              className="flex-1 rounded-2xl bg-foreground text-background py-4 text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform">
              {loading ? "Creating..." : `Stake ${stakeAmount} LC`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
