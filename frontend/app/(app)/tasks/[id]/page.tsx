"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/custom/StatusBadge";
import { CountdownTimer } from "@/components/custom/CountdownTimer";
import { ProofUploader } from "@/components/custom/ProofUploader";
import { VerifyModal } from "@/components/custom/VerifyModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/types";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  study: "bg-indigo-500", fitness: "bg-orange-500", wellness: "bg-emerald-500",
  productivity: "bg-blue-500", social: "bg-pink-500", custom: "bg-gray-400",
};

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const { user } = useAuthStore();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try { const res = await api.get(`/tasks/${taskId}`); setTask(res.data); }
      catch { /**/ } finally { setLoading(false); }
    }
    load();
    const supabase = createClient();
    const channel = supabase.channel(`task-${taskId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks", filter: `id=eq.${taskId}` },
        (payload) => setTask((prev) => {
          const row = payload.new as Partial<Task>;
          if (!prev) return row as Task;
          return { ...prev, ...row, proof_url: row.proof_url ?? prev.proof_url, proof_text: row.proof_text ?? prev.proof_text, verifier_feedback: row.verifier_feedback ?? prev.verifier_feedback, creator_name: prev.creator_name, verifier_name: prev.verifier_name };
        }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId]);

  if (loading) return (
    <div className="space-y-4 pt-4">
      {[1, 2, 3].map(i => <div key={i} className="rounded-2xl bg-card card-shadow h-16 animate-pulse" />)}
    </div>
  );
  if (!task) return <p className="text-destructive py-8 text-center">Task not found.</p>;

  const isCreator = user?.id === task.creator_id;
  const isVerifier = user?.id === task.verifier_id;

  async function handleAccept() {
    setActionLoading(true);
    try { const res = await api.post(`/tasks/${taskId}/accept`); setTask(res.data); } catch { /**/ }
    finally { setActionLoading(false); }
  }
  async function handleDecline() {
    setActionLoading(true);
    try { const res = await api.post(`/tasks/${taskId}/decline`); setTask(res.data); } catch { /**/ }
    finally { setActionLoading(false); }
  }
  async function handleSubmitProof(proofUrl: string | null, proofText: string | null) {
    setActionLoading(true);
    try { const res = await api.post(`/tasks/${taskId}/submit`, { proof_url: proofUrl, proof_text: proofText }); setTask(res.data); } catch { /**/ }
    finally { setActionLoading(false); }
  }
  async function handleVerify(approved: boolean, feedback: string | null) {
    setActionLoading(true);
    try { const res = await api.post(`/tasks/${taskId}/verify`, { approved, feedback }); setTask(res.data); setVerifyOpen(false); } catch { /**/ }
    finally { setActionLoading(false); }
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Back */}
      <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Stakes
      </Link>

      {/* Hero card */}
      <div className="rounded-3xl bg-card card-shadow overflow-hidden">
        <div className={cn("h-1.5 w-full", categoryColors[task.category] ?? "bg-gray-400")} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-lg font-bold leading-snug flex-1">{task.title}</h1>
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="rounded-2xl bg-foreground px-4 py-2 text-background">
              <span className="text-xl font-bold">{task.stake_amount}</span>
              <span className="text-xs opacity-50 ml-1">LC</span>
            </div>
            <span className="text-sm text-muted-foreground capitalize rounded-xl bg-muted px-3 py-1.5">{task.category}</span>
            {task.status === "active" && (
              <CountdownTimer deadline={task.deadline} className="text-sm font-semibold text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="rounded-2xl bg-card card-shadow divide-y divide-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">Verifier</span>
          <span className="text-sm font-semibold">{task.verifier_name ?? "Unknown"}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">Due</span>
          <span className="text-sm font-semibold">
            {new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
            {new Date(task.deadline).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">Proof type</span>
          <span className="text-sm font-semibold capitalize">{task.proof_type}</span>
        </div>
      </div>

      {/* Declined notice */}
      {task.status === "declined" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800">
          {isVerifier ? "You declined this stake. The creator's stake was returned." : "Verifier declined this stake. Your stake was returned."}
        </div>
      )}

      {/* Proof */}
      {(task.proof_url || task.proof_text) && (
        <div className="rounded-2xl bg-card card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted Proof</p>
          </div>
          <div className="p-4 space-y-3">
            {task.proof_url && (
              <div className="overflow-hidden rounded-2xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={task.proof_url} alt="Proof" className="w-full max-h-72 object-contain" />
              </div>
            )}
            {task.proof_text && (
              <p className="text-sm text-foreground leading-relaxed">{task.proof_text}</p>
            )}
          </div>
        </div>
      )}

      {/* Verifier feedback */}
      {(task.status === "completed" || task.status === "failed") && task.verifier_feedback && (
        <div className="rounded-2xl bg-muted/60 px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Verifier Feedback</p>
          <p className="text-sm leading-relaxed">{task.verifier_feedback}</p>
        </div>
      )}

      {/* Verifier: Accept/Decline */}
      {isVerifier && task.status === "pending_acceptance" && (
        <div className="flex gap-3 pt-2">
          <button onClick={handleDecline} disabled={actionLoading}
            className="flex-1 rounded-2xl border border-border bg-card py-4 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 active:scale-[0.98]">
            Decline
          </button>
          <button onClick={handleAccept} disabled={actionLoading}
            className="flex-1 rounded-2xl bg-foreground text-background py-4 text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform">
            {actionLoading ? "..." : "Accept Stake"}
          </button>
        </div>
      )}

      {/* Creator: Submit Proof */}
      {isCreator && task.status === "active" && (
        <div className="rounded-2xl bg-card card-shadow p-5 space-y-4">
          <h3 className="font-semibold">Submit Proof</h3>
          <ProofUploader taskId={task.id} proofType={task.proof_type} onSubmit={handleSubmitProof} loading={actionLoading} />
        </div>
      )}

      {/* Verifier: Verify */}
      {isVerifier && task.status === "proof_submitted" && (
        <button onClick={() => setVerifyOpen(true)}
          className="w-full rounded-2xl bg-foreground text-background py-4 text-sm font-semibold active:scale-[0.98] transition-transform">
          Review &amp; Verify Proof
        </button>
      )}

      <VerifyModal task={task} open={verifyOpen} onClose={() => setVerifyOpen(false)} onVerify={handleVerify} loading={actionLoading} />
    </div>
  );
}
