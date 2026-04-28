-- Friendships table
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);

-- RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can read friendships they're part of
CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send friend requests (as requester)
CREATE POLICY "Users can send friend requests"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- Addressee can update (accept/decline)
CREATE POLICY "Addressee can respond to requests"
    ON friendships FOR UPDATE
    USING (auth.uid() = addressee_id);

-- Either party can delete (unfriend)
CREATE POLICY "Users can remove friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
