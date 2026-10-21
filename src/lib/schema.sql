-- Neon Postgres Schema for otwbayar
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  trip_date TEXT NOT NULL,
  target_amount BIGINT NOT NULL DEFAULT 0,
  current_amount BIGINT NOT NULL DEFAULT 0,
  bank_account_details TEXT DEFAULT 'BCA 8040192831 a/n Bendahara',
  qris_image_url TEXT NOT NULL,
  coordinator_token TEXT UNIQUE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_categories (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  allocated_amount BIGINT NOT NULL DEFAULT 0,
  spent_amount BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  member_token TEXT UNIQUE NOT NULL,
  target_quota BIGINT NOT NULL DEFAULT 0,
  paid_amount BIGINT NOT NULL DEFAULT 0,
  avatar_color TEXT DEFAULT '#2D5A27',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_proofs (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT,
  amount BIGINT NOT NULL,
  proof_image_url TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
  paid_by_name TEXT,
  category_id TEXT REFERENCES budget_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  title TEXT NOT NULL,
  amount BIGINT NOT NULL,
  receipt_image_url TEXT,
  source TEXT NOT NULL DEFAULT 'POOL_FUND',
  split_type TEXT NOT NULL DEFAULT 'ALL',
  assigned_member_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  amount BIGINT,
  badge TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
