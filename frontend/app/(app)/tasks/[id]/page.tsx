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
      try {
        const res = await api.get(`/tasks/${taskId}`);
        setTask(res.data);
      } catch { /* */ } finally { setLoading(false); }
    }
    load();

    const supabase = createClient();
    const channel = supabase
      .channel(`task-${taskId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks", filter: `id=eq.${taskId}` },
        (payload) =>
          setTask((prev) => {
            const row = payload.new as Partial<Task>;
            if (!prev) return row as Task;
            return {
              ...prev,
              ...row,
              proof_url: row.proof_url ?? prev.proof_url,
              proof_text: row.proof_text ?? prev.proof_text,
              verifier_feedback: row.verifier_feedback ?? prev.verifier_feedback,
              creator_name: prev.creator_name,
              verifier_name: prev.verifier_name,
            };
          }))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [taskId]);

  if (loading) return <p className="text-muted-foreground py-8 text-center">Loading...</p>;
  if (!task) return <p className="text-destructive py-8 text-center">Task not found.</p>;

  const isCreator = user?.id === task.creator_id;
  const isVerifier = user?.id === task.verifier_id;

  async function handleAccept() {
    setActionLoading(true);
    try { const res = await api.post(`/tasks/${taskId}/accept`); setTask(res.data); } catch { /* */ }
    finally { setActionLoading(false); }
  }

  async function handleDecline() {
    setActionLoading(true);
    try { const res = await api.post(`/tasks/${taskId}/decline`); setTask(res.data); } catch { /* */ }
    finally { setActionLoading(false); }
  }

  async function handleSubmitProof(proofUrl: string | null, proofText: string | null) {
    setActionLoading(true);
    try { const res = await api.post(`/tasks/${taskId}/submit`, { proof_url: proofUrl, proof_text: proofText }); setTask(res.data); } catch { /* */ }
    finally { setActionLoading(false); }
  }

  async function handleVerify(approved: boolean, feedback: string | null) {
    setActionLoading(true);
    try { const res = await api.post(`/tasks/${taskId}/verify`, { approved, feedback }); setTask(res.data); setVerifyOpen(false); } catch { /* */ }
    finally { setActionLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Stakes
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl font-bold">{task.title}</h1>
          <StatusBadge status={task.status} />
        </div>
        {task.description && (
          <p className="text-muted-foreground text-sm">{task.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
            Verifier: {task.verifier_name ?? "Unknown"}
          </span>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-2xl font-bold text-accent">${task.stake_amount}</span>
        <span className="text-sm text-muted-foreground capitalize bg-muted px-2.5 py-0.5 rounded-full">{task.category}</span>
        {task.status === "active" && (
          <CountdownTimer deadline={task.deadline} className="text-sm font-medium text-destructive" />
        )}
      </div>

      {task.status === "declined" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {isVerifier
            ? "You declined this stake. The creator's stake was returned."
            : "Verifier declined this stake. Your stake was returned."}
        </div>
      )}

      <p className="text-sm font-medium text-red-600">
        Due date:{" "}
        {new Date(task.deadline).toLocaleDateString([], {
          month: "2-digit",
          day: "2-digit",
        })}{" "}
        {new Date(task.deadline).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </p>

      {(task.proof_url || task.proof_text) && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Submitted proof
          </h3>
          {task.proof_url && (
            <div className="overflow-hidden rounded-xl border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.proof_url}
                alt="Submitted proof"
                className="mx-auto max-h-[min(360px,55vh)] w-full object-contain"
              />
            </div>
          )}
          {task.proof_text && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{task.proof_text}</p>
            </div>
          )}
        </div>
      )}

      {(task.status === "completed" || task.status === "failed") && task.verifier_feedback && (
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Verifier feedback
          </p>
          <p className="text-sm whitespace-pre-wrap">{task.verifier_feedback}</p>
        </div>
      )}

      {/* Verifier Actions */}
      {isVerifier && task.status === "pending_acceptance" && (
        <div className="flex gap-3">
          <button onClick={handleDecline} disabled={actionLoading}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
            Decline
          </button>
          <button onClick={handleAccept} disabled={actionLoading}
            className="flex-1 rounded-xl bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
            Accept
          </button>
        </div>
      )}

      {/* Creator: Submit Proof */}
      {isCreator && task.status === "active" && (
        <div className="rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-semibold">Submit Proof</h3>
          <ProofUploader
            taskId={task.id}
            proofType={task.proof_type}
            onSubmit={handleSubmitProof}
            loading={actionLoading}
          />
        </div>
      )}

      {/* Verifier: Verify */}
      {isVerifier && task.status === "proof_submitted" && (
        <button onClick={() => setVerifyOpen(true)}
          className="w-full rounded-xl bg-gray-900 text-white py-3 text-sm font-medium hover:bg-gray-800 transition-colors">
          Review &amp; Verify
        </button>
      )}

      <VerifyModal
        task={task}
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerify={handleVerify}
        loading={actionLoading}
      />
    </div>
  );
}
