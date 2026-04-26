"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinBadge } from "@/components/custom/CoinBadge";
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
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    load();

    // Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`task-${taskId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks", filter: `id=eq.${taskId}` },
        (payload) => setTask(payload.new as Task)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!task) return <p className="text-destructive">Task not found.</p>;

  const isCreator = user?.id === task.creator_id;
  const isVerifier = user?.id === task.verifier_id;

  async function handleAccept() {
    setActionLoading(true);
    try {
      const res = await api.post(`/tasks/${taskId}/accept`);
      setTask(res.data);
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDecline() {
    setActionLoading(true);
    try {
      const res = await api.post(`/tasks/${taskId}/decline`);
      setTask(res.data);
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSubmitProof(proofUrl: string | null, proofText: string | null) {
    setActionLoading(true);
    try {
      const res = await api.post(`/tasks/${taskId}/submit`, { proof_url: proofUrl, proof_text: proofText });
      setTask(res.data);
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerify(approved: boolean, feedback: string | null) {
    setActionLoading(true);
    try {
      const res = await api.post(`/tasks/${taskId}/verify`, { approved, feedback });
      setTask(res.data);
      setVerifyOpen(false);
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{task.title}</CardTitle>
            <StatusBadge status={task.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <p className="text-muted-foreground">{task.description}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <CoinBadge amount={task.stake_amount} />
            <span className="text-sm text-muted-foreground capitalize">{task.category}</span>
            {task.status === "active" && (
              <CountdownTimer deadline={task.deadline} className="text-sm font-medium text-destructive" />
            )}
          </div>

          {/* Verifier Actions */}
          {isVerifier && task.status === "pending_acceptance" && (
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleDecline} disabled={actionLoading} className="flex-1">
                Decline
              </Button>
              <Button onClick={handleAccept} disabled={actionLoading} className="flex-1">
                Accept
              </Button>
            </div>
          )}

          {/* Creator: Submit Proof */}
          {isCreator && task.status === "active" && (
            <div className="pt-2">
              <h3 className="font-semibold mb-3">Submit Proof</h3>
              <ProofUploader
                taskId={task.id}
                proofType={task.proof_type}
                onSubmit={handleSubmitProof}
                loading={actionLoading}
              />
            </div>
          )}

          {/* Proof display */}
          {task.proof_url && (
            <div className="rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={task.proof_url} alt="Proof" className="w-full" />
            </div>
          )}
          {task.proof_text && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium mb-1">Proof description:</p>
              <p className="text-sm">{task.proof_text}</p>
            </div>
          )}

          {/* Verifier: Verify */}
          {isVerifier && task.status === "proof_submitted" && (
            <Button onClick={() => setVerifyOpen(true)} className="w-full">
              Review & Verify
            </Button>
          )}
        </CardContent>
      </Card>

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
