export type RoleType = 'COORDINATOR' | 'MEMBER';
export type ProofStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ExpenseSource = 'POOL_FUND' | 'MEMBER_REIMBURSE';

export interface Group {
  id: string;
  name: string;
  description?: string;
  location: string;
  trip_date: string; // YYYY-MM-DD
  target_amount: number; // Rupiah integer
  current_amount: number; // Total iuran terkumpul (approved deposits)
  bank_account_details?: string;
  qris_image_url: string;
  coordinator_token: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  group_id: string;
  name: string;
  allocated_amount: number;
  spent_amount?: number;
  created_at: string;
}

export interface Member {
  id: string;
  group_id: string;
  name: string;
  email?: string;
  role: RoleType;
  member_token: string;
  target_quota: number;
  paid_amount: number;
  avatar_color: string;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  group_id: string;
  member_id: string;
  member_name?: string;
  amount: number;
  proof_image_url: string;
  note?: string;
  status: ProofStatus;
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by_member_id?: string;
  paid_by_name?: string;
  category_id?: string;
  category_name?: string;
  title: string;
  amount: number;
  receipt_image_url?: string;
  source: ExpenseSource;
  split_type?: 'ALL' | 'ASSIGNED' | 'PERSONAL';
  assigned_member_ids?: string[];
  created_at: string;
}

export interface ActivityFeedItem {
  id: string;
  group_id: string;
  actor_name: string;
  action: string;
  timestamp: string;
  amount?: number;
  badge?: string;
}
