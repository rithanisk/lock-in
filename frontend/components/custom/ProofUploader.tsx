"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  /** Path inside the `proofs` bucket — used to delete from storage when removing */
  const [storedObjectPath, setStoredObjectPath] = useState<string | null>(null);
  const storedPathRef = useRef<string | null>(null);

  useEffect(() => {
    storedPathRef.current = storedObjectPath;
  }, [storedObjectPath]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      setUploadError(null);
      const priorStoredPath = storedPathRef.current;
      const file = acceptedFiles[0];
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });
      const supabase = createClient();

      const safeName = file.name.replace(/[^\w.-]/g, "_");
      const path = `${taskId}/${Date.now()}-${safeName}`;

      const { data, error } = await supabase.storage.from("proofs").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        setUploadError(error.message);
        setUploading(false);
        setLocalPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        // Keep prior successful upload if this was a replacement attempt
        if (!priorStoredPath) {
          setUploadedUrl(null);
          setStoredObjectPath(null);
        }
        return;
      }

      if (data) {
        if (priorStoredPath && priorStoredPath !== data.path) {
          await supabase.storage.from("proofs").remove([priorStoredPath]);
        }
        const { data: urlData } = supabase.storage.from("proofs").getPublicUrl(data.path);
        setUploadedUrl(urlData.publicUrl);
        setStoredObjectPath(data.path);
        setLocalPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }
      setUploading(false);
    },
    [taskId]
  );

  const clearPhoto = useCallback(async () => {
    setUploadError(null);
    setUploadedUrl(null);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    const path = storedObjectPath;
    setStoredObjectPath(null);
    if (path) {
      const supabase = createClient();
      const { error } = await supabase.storage.from("proofs").remove([path]);
      if (error) setUploadError(error.message);
    }
  }, [storedObjectPath]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
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
          {(uploadedUrl || localPreview) && (
            <div className="mb-4 overflow-hidden rounded-xl border border-border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedUrl ?? localPreview ?? ""}
                alt="Proof preview"
                className="mx-auto max-h-56 w-full object-contain"
              />
            </div>
          )}
          {uploading ? (
            <p className="text-muted-foreground">Uploading...</p>
          ) : uploadedUrl || localPreview ? (
            <p className="text-sm text-muted-foreground">
              {uploadedUrl ? (
                <span className="text-green-600 font-medium">Uploaded.</span>
              ) : null}{" "}
              Click or drop to replace
            </p>
          ) : (
            <p className="text-muted-foreground">
              {isDragActive ? "Drop photo here" : "Drag & drop proof photo, or click to select"}
            </p>
          )}
          {uploadError && <p className="mt-3 text-sm text-destructive">{uploadError}</p>}
        </div>
      )}

      {showPhoto && (uploadedUrl || localPreview) && !uploading && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => open()}>
            Upload another
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => void clearPhoto()}
          >
            Remove photo
          </Button>
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
