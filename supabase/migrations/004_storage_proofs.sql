-- Proof images for tasks (client uploads via Supabase Storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('proofs', 'proofs', true, 5242880)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "proofs_public_read" ON storage.objects;
DROP POLICY IF EXISTS "proofs_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "proofs_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "proofs_authenticated_delete" ON storage.objects;

CREATE POLICY "proofs_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proofs');

CREATE POLICY "proofs_authenticated_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proofs');

CREATE POLICY "proofs_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'proofs')
  WITH CHECK (bucket_id = 'proofs');

CREATE POLICY "proofs_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'proofs');
