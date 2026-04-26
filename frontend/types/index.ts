export type TaskStatus =
  | "pending_acceptance"
  | "active"
  | "proof_submitted"
  | "completed"
  | "failed"
  | "expired"
  | "declined";

export type TaskCategory =
  | "study"
  | "fitness"
  | "wellness"
  | "productivity"
  | "social"
  | "custom";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  stake_amount: number;
  creator_id: string;
  verifier_id: string;
  status: TaskStatus;
  deadline: string;
  proof_type: string;
  proof_url: string | null;
  proof_text: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface UserSummary {
  id: string;
  display_name: string;
  avatar_url: string | null;
  university: string | null;
  balance: number;
  current_streak: number;
  longest_streak: number;
  created_at: string | null;
}

export interface Squad {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  pot_balance: number;
  max_members: number;
  creator_id: string;
  created_at: string;
  member_count: number;
}

export interface SpendProposal {
  id: string;
  squad_id: string;
  title: string;
  description: string | null;
  amount: number;
  proposer_id: string;
  votes_for: number;
  votes_against: number;
  status: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
}
