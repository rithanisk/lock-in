-- LockIn App - Initial Schema

-- Enums
CREATE TYPE task_status AS ENUM (
  'pending_acceptance', 'active', 'proof_submitted',
  'completed', 'failed', 'expired', 'declined'
);

CREATE TYPE task_category AS ENUM (
  'study', 'fitness', 'wellness', 'productivity', 'social', 'custom'
);

CREATE TYPE transaction_type AS ENUM (
  'stake_lock', 'stake_return', 'stake_forfeit',
  'forfeit_received', 'stake_forfeit_pot', 'welcome_bonus'
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  university TEXT,
  balance INTEGER NOT NULL DEFAULT 100,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category task_category NOT NULL DEFAULT 'custom',
  stake_amount INTEGER NOT NULL CHECK (stake_amount >= 1 AND stake_amount <= 50),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  verifier_id UUID NOT NULL REFERENCES profiles(id),
  status task_status NOT NULL DEFAULT 'pending_acceptance',
  deadline TIMESTAMPTZ NOT NULL,
  proof_type TEXT NOT NULL DEFAULT 'photo',
  proof_url TEXT,
  proof_text TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_users CHECK (creator_id != verifier_id)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  type transaction_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Squads
CREATE TABLE squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  pot_balance INTEGER NOT NULL DEFAULT 0,
  max_members INTEGER NOT NULL DEFAULT 10,
  creator_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Squad Members
CREATE TABLE squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(squad_id, user_id)
);

-- Spend Proposals
CREATE TABLE spend_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL CHECK (amount >= 1),
  proposer_id UUID NOT NULL REFERENCES profiles(id),
  votes_for INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proposal Votes
CREATE TABLE proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES spend_proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  vote BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, user_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_verifier ON tasks(verifier_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_squad_members_squad ON squad_members(squad_id);
CREATE INDEX idx_squad_members_user ON squad_members(user_id);

-- Trigger: auto-create profile on sign up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    100
  );

  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (NEW.id, 100, 'welcome_bonus', 'Welcome to LockIn! Here are your starting LockCoins.');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tasks: creator and verifier can read, creator can insert
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = verifier_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = verifier_id);

-- Transactions: users can read own
CREATE POLICY "transactions_select" ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Squads: members can read
CREATE POLICY "squads_select" ON squads FOR SELECT USING (true);
CREATE POLICY "squads_insert" ON squads FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Squad members
CREATE POLICY "squad_members_select" ON squad_members FOR SELECT USING (true);
CREATE POLICY "squad_members_insert" ON squad_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Spend proposals: squad members can read
CREATE POLICY "spend_proposals_select" ON spend_proposals FOR SELECT USING (true);
CREATE POLICY "spend_proposals_insert" ON spend_proposals FOR INSERT
  WITH CHECK (auth.uid() = proposer_id);

-- Proposal votes
CREATE POLICY "proposal_votes_select" ON proposal_votes FOR SELECT USING (true);
CREATE POLICY "proposal_votes_insert" ON proposal_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Notifications: users can read/update own
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
