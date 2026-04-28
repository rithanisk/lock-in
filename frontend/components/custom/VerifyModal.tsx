"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@/types";

interface VerifyModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onVerify: (approved: boolean, feedback: string | null) => void;
  loading?: boolean;
}

export function VerifyModal({ task, open, onClose, onVerify, loading }: VerifyModalProps) {
  const [feedback, setFeedback] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify: {task.title}</DialogTitle>
          <DialogDescription>
            Review the proof and decide if the task was completed. Any note you add is visible to the creator after you approve or reject.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {task.proof_url && (
            <div className="rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={task.proof_url} alt="Proof" className="w-full" />
            </div>
          )}

          {task.proof_text && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">{task.proof_text}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="verify-feedback" className="text-sm font-medium">
              Feedback / note <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              id="verify-feedback"
              placeholder="Explain your decision — visible to the stake creator…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onVerify(false, feedback || null)}
              disabled={loading}
            >
              Reject
            </Button>
            <Button
              className="flex-1"
              onClick={() => onVerify(true, feedback || null)}
              disabled={loading}
            >
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
