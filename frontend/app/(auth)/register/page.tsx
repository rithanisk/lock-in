"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="35" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }}>
              <rect x="4" y="0" width="8" height="2" fill="#9a9a9a"/>
              <rect x="3" y="1" width="2" height="7" fill="#b0b0b0"/>
              <rect x="11" y="1" width="2" height="7" fill="#b0b0b0"/>
              <rect x="4" y="0" width="1" height="1" fill="#c8c8c8"/>
              <rect x="11" y="0" width="1" height="1" fill="#c8c8c8"/>
              <rect x="1" y="6" width="14" height="1" fill="#f5c842"/>
              <rect x="0" y="7" width="16" height="12" fill="#d4960f"/>
              <rect x="1" y="7" width="14" height="11" fill="#e8aa18"/>
              <rect x="2" y="7" width="12" height="10" fill="#f0bc28"/>
              <rect x="1" y="7" width="2" height="10" fill="#f5cc44"/>
              <rect x="2" y="7" width="11" height="2" fill="#f8d458"/>
              <rect x="6" y="11" width="4" height="3" fill="#5a3000"/>
              <rect x="5" y="12" width="6" height="2" fill="#5a3000"/>
              <rect x="7" y="13" width="2" height="3" fill="#5a3000"/>
              <rect x="0" y="18" width="16" height="1" fill="#8b6000"/>
              <rect x="1" y="19" width="14" height="1" fill="#5a3e00"/>
              <rect x="14" y="7" width="2" height="11" fill="#c08010"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-muted-foreground text-sm">Join LockIn and start staking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-xl h-11"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent text-accent-foreground font-semibold py-2.5 text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
