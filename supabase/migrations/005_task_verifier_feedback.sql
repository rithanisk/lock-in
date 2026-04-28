-- Store optional verifier notes when approving or rejecting proof
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS verifier_feedback TEXT;
