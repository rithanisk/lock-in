"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinBadge } from "@/components/custom/CoinBadge";
import api from "@/lib/api";
import type { UserSummary } from "@/types";

const categories = [
  { value: "study", label: "Study" },
  { value: "fitness", label: "Fitness" },
  { value: "wellness", label: "Wellness" },
  { value: "productivity", label: "Productivity" },
  { value: "social", label: "Social" },
  { value: "custom", label: "Custom" },
];

export default function NewTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");
  const [stakeAmount, setStakeAmount] = useState(5);
  const [proofType, setProofType] = useState("photo");
  const [deadline, setDeadline] = useState("");

  // Verifier search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [selectedVerifier, setSelectedVerifier] = useState<UserSummary | null>(null);

  async function searchUsers(q: string) {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch {
      // handle error
    }
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
      const message = err instanceof Error ? err.message : "Failed to create task";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Task</h1>

      {/* Step 1: Task Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">What do you want to accomplish?</Label>
              <Input
                id="title"
                placeholder="e.g., Study 2 hours for midterm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description (optional)</Label>
              <Textarea
                id="desc"
                placeholder="Add details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Proof Type</Label>
              <Select value={proofType} onValueChange={setProofType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={() => setStep(2)}
              disabled={!title || !deadline}
            >
              Next: Set Stake
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Stake */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Set Your Stake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              How many LockCoins are you willing to put on the line?
            </p>

            <div className="flex items-center gap-4">
              <Input
                type="range"
                min={1}
                max={50}
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Number(e.target.value))}
                className="flex-1"
              />
              <CoinBadge amount={stakeAmount} size="lg" />
            </div>

            <div className="flex gap-2">
              {[1, 5, 10, 25, 50].map((v) => (
                <Button
                  key={v}
                  variant={stakeAmount === v ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStakeAmount(v)}
                >
                  {v}
                </Button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Next: Choose Verifier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Verifier */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose Your Verifier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search for a friend</Label>
              <Input
                placeholder="Type a name..."
                value={searchQuery}
                onChange={(e) => searchUsers(e.target.value)}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between"
                    onClick={() => {
                      setSelectedVerifier(u);
                      setSearchResults([]);
                      setSearchQuery(u.display_name);
                    }}
                  >
                    <span className="font-medium text-sm">{u.display_name}</span>
                    {u.university && (
                      <span className="text-xs text-muted-foreground">{u.university}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedVerifier && (
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-sm font-medium">
                  Verifier: {selectedVerifier.display_name}
                </p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedVerifier || loading}
                className="flex-1"
              >
                {loading ? "Creating..." : `Lock in ${stakeAmount} LC`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
