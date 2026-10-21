import { neon } from '@neondatabase/serverless';
import { Group, Member, BudgetCategory, PaymentProof, Expense, ActivityFeedItem } from '@/types';

// In-memory fallback store when DATABASE_URL is not set (e.g. initial demo / local dev)
class MemoryStore {
  groups: Map<string, Group> = new Map();
  categories: Map<string, BudgetCategory[]> = new Map();
  members: Map<string, Member[]> = new Map();
  proofs: Map<string, PaymentProof[]> = new Map();
  expenses: Map<string, Expense[]> = new Map();
  activities: Map<string, ActivityFeedItem[]> = new Map();

  constructor() {
    this.seedDemoData();
  }

  seedDemoData() {
    const groupId = 'demo-glamping';
    const group: Group = {
      id: groupId,
      name: 'Weekend Glamping Squad',
      description: 'Trip akhir pekan bareng squad: campfire, BBQ daging, tenda safari & river tubing!',
      location: 'Camp Riverside',
      trip_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      target_amount: 5600000,
      current_amount: 3920000,
      bank_account_details: 'BCA 8040192831 a/n Sarah Bendahara',
      qris_image_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
      coordinator_token: 'coord_sarah_lead',
      invite_code: 'GLAMP-SQUAD',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.groups.set(groupId, group);

    const categories: BudgetCategory[] = [
      { id: 'cat-1', group_id: groupId, name: 'Sewa Tenda Safari Glamping (2 Tenda)', allocated_amount: 2800000, spent_amount: 2800000, created_at: new Date().toISOString() },
      { id: 'cat-2', group_id: groupId, name: 'Paket BBQ & Bahan Makanan', allocated_amount: 1400000, spent_amount: 850000, created_at: new Date().toISOString() },
      { id: 'cat-3', group_id: groupId, name: 'Transportasi & Bensin', allocated_amount: 1050000, spent_amount: 400000, created_at: new Date().toISOString() },
      { id: 'cat-4', group_id: groupId, name: 'Dana Darurat & Snack Lapangan', allocated_amount: 350000, spent_amount: 80000, created_at: new Date().toISOString() },
    ];
    this.categories.set(groupId, categories);

    const members: Member[] = [
      { id: 'm-1', group_id: groupId, name: 'Sarah (Bendahara)', email: 'sarah@squadglamp.id', role: 'COORDINATOR', member_token: 'coord_sarah_lead', target_quota: 800000, paid_amount: 800000, avatar_color: '#245229', created_at: new Date().toISOString() },
      { id: 'm-2', group_id: groupId, name: 'Dimas Ardi', email: 'dimas@squadglamp.id', role: 'MEMBER', member_token: 'mem_dimas_k91x', target_quota: 800000, paid_amount: 800000, avatar_color: '#BF5733', created_at: new Date().toISOString() },
      { id: 'm-3', group_id: groupId, name: 'Nadya Putri', email: 'nadya@squadglamp.id', role: 'MEMBER', member_token: 'mem_nadya_p42v', target_quota: 800000, paid_amount: 800000, avatar_color: '#2B577E', created_at: new Date().toISOString() },
      { id: 'm-4', group_id: groupId, name: 'Reza Pratama', email: 'reza@squadglamp.id', role: 'MEMBER', member_token: 'mem_reza_r88m', target_quota: 800000, paid_amount: 800000, avatar_color: '#477C6B', created_at: new Date().toISOString() },
      { id: 'm-5', group_id: groupId, name: 'Fikri Haikal', email: 'fikri@squadglamp.id', role: 'MEMBER', member_token: 'mem_fikri_f19s', target_quota: 800000, paid_amount: 400000, avatar_color: '#9C6E2E', created_at: new Date().toISOString() },
      { id: 'm-6', group_id: groupId, name: 'Alika Zahra', email: 'alika@squadglamp.id', role: 'MEMBER', member_token: 'mem_alika_a77u', target_quota: 800000, paid_amount: 320000, avatar_color: '#8A5328', created_at: new Date().toISOString() },
      { id: 'm-7', group_id: groupId, name: 'Genta Arya', email: 'genta@squadglamp.id', role: 'MEMBER', member_token: 'mem_genta_g33t', target_quota: 800000, paid_amount: 0, avatar_color: '#556037', created_at: new Date().toISOString() },
    ];
    this.members.set(groupId, members);

    const proofs: PaymentProof[] = [
      {
        id: 'proof-1',
        group_id: groupId,
        member_id: 'm-5',
        member_name: 'Fikri Haikal',
        amount: 400000,
        proof_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        note: 'Pelunasan sisa cicilan kedua Fikri',
        status: 'PENDING',
        submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'proof-0',
        group_id: groupId,
        member_id: 'm-2',
        member_name: 'Dimas Ardi',
        amount: 800000,
        proof_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        note: 'Lunas langsung ya Sar!',
        status: 'APPROVED',
        submitted_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        reviewed_at: new Date(Date.now() - 3600000 * 46).toISOString(),
        reviewed_by: 'm-1',
      }
    ];
    this.proofs.set(groupId, proofs);

    const expenses: Expense[] = [
      {
        id: 'exp-1',
        group_id: groupId,
        paid_by_member_id: 'm-2',
        paid_by_name: 'Dimas Ardi',
        category_id: 'cat-4',
        category_name: 'Dana Darurat & Snack Lapangan',
        title: 'Briket Arang Kelapa & Minyak Tanah',
        amount: 45000,
        receipt_image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
        source: 'MEMBER_REIMBURSE',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'exp-2',
        group_id: groupId,
        paid_by_member_id: 'm-1',
        paid_by_name: 'Sarah (Bendahara)',
        category_id: 'cat-4',
        category_name: 'Dana Darurat & Snack Lapangan',
        title: 'Galon Air Mineral Le Minerale & Es Kristal',
        amount: 35000,
        receipt_image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
        source: 'POOL_FUND',
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      }
    ];
    this.expenses.set(groupId, expenses);

    const activities: ActivityFeedItem[] = [
      {
        id: 'act-1',
        group_id: groupId,
        actor_name: 'Fikri Haikal',
        action: 'mengunggah bukti transfer Rp 400.000 (menunggu verifikasi)',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        amount: 400000,
      },
      {
        id: 'act-2',
        group_id: groupId,
        actor_name: 'Dimas Ardi',
        action: 'mencatat nota talangan "Briket Arang" Rp 45.000',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        amount: 45000,
      },
      {
        id: 'act-3',
        group_id: groupId,
        actor_name: 'Sarah (Bendahara)',
        action: 'menyetujui setoran Rp 800.000 dari Dimas Ardi',
        timestamp: new Date(Date.now() - 3600000 * 46).toISOString(),
        amount: 800000,
      },
    ];
    this.activities.set(groupId, activities);
  }
}

// Global singleton to persist during development hot-reloads
const globalForStore = globalThis as unknown as { otwStore: MemoryStore };
export const memoryStore = globalForStore.otwStore || new MemoryStore();
if (process.env.NODE_ENV !== 'production') globalForStore.otwStore = memoryStore;

// Neon SQL helper
export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  return neon(connectionString);
}
