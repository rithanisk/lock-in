"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ProofUploaderProps {
  taskId: string;
  proofType: string;
  onSubmit: (proofUrl: string | null, proofText: string | null) => void;
  loading?: boolean;
}

export function ProofUploader({ taskId, proofType, onSubmit, loading }: ProofUploaderProps) {
  const [proofText, setProofText] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      const file = acceptedFiles[0];
      const supabase = createClient();
      const path = `proofs/${taskId}/${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("proofs")
        .upload(path, file);

      if (!error && data) {
        const { data: urlData } = supabase.storage.from("proofs").getPublicUrl(data.path);
        setUploadedUrl(urlData.publicUrl);
      }
      setUploading(false);
    },
    [taskId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const showPhoto = proofType === "photo" || proofType === "both";
  const showText = proofType === "text" || proofType === "both";

  return (
    <div className="space-y-4">
      {showPhoto && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <p className="text-muted-foreground">Uploading...</p>
          ) : uploadedUrl ? (
            <p className="text-green-600 font-medium">Photo uploaded! Click to replace.</p>
          ) : (
            <p className="text-muted-foreground">
              {isDragActive ? "Drop photo here" : "Drag & drop proof photo, or click to select"}
            </p>
          )}
        </div>
      )}

      {showText && (
        <Textarea
          placeholder="Describe what you accomplished..."
          value={proofText}
          onChange={(e) => setProofText(e.target.value)}
          rows={3}
        />
      )}

      <Button
        onClick={() => onSubmit(uploadedUrl, proofText || null)}
        disabled={loading || uploading || (!uploadedUrl && !proofText)}
        className="w-full"
      >
        {loading ? "Submitting..." : "Submit Proof"}
      </Button>
    </div>
  );
}
