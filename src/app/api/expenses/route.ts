import { NextResponse } from 'next/server';
import { getDb, memoryStore } from '@/lib/db';
import { Expense } from '@/types';
import { formatIDR } from '@/lib/format';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, paidByMemberId, categoryId, title, amount, receiptImageUrl, source, splitType, assignedMemberIds } = body;
    
    // ponytail: enforce positive integer rupiah
    const expenseAmount = Math.floor(Number(amount));
    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
      return NextResponse.json({ error: 'Nominal pengeluaran harus lebih dari Rp 0' }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Nama pengeluaran tidak boleh kosong' }, { status: 400 });
    }

    const sql = getDb();

    let payerName = 'Kas Bersama';
    let catName = 'Pengeluaran Lapangan';

    if (sql) {
      if (paidByMemberId) {
        const m = await sql`SELECT name FROM members WHERE id = ${paidByMemberId} LIMIT 1`;
        if (m.length > 0) payerName = m[0].name as string;
      }
      if (categoryId) {
        const c = await sql`SELECT name FROM budget_categories WHERE id = ${categoryId} LIMIT 1`;
        if (c.length > 0) catName = c[0].name as string;
      }

      const assignedJson = JSON.stringify(assignedMemberIds || []);
      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        group_id: groupId,
        paid_by_member_id: paidByMemberId || undefined,
        paid_by_name: payerName,
        category_id: categoryId || undefined,
        category_name: catName,
        title: title || 'Belanja On-site',
        amount: expenseAmount,
        receipt_image_url: receiptImageUrl,
        source: source || 'POOL_FUND',
        split_type: splitType || 'ALL',
        assigned_member_ids: assignedMemberIds || [],
        created_at: new Date().toISOString(),
      };

      try {
        await sql`
          INSERT INTO expenses (id, group_id, paid_by_member_id, paid_by_name, category_id, category_name, title, amount, receipt_image_url, source, split_type, assigned_member_ids)
          VALUES (${newExpense.id}, ${newExpense.group_id}, ${newExpense.paid_by_member_id || null}, ${newExpense.paid_by_name}, ${newExpense.category_id || null}, ${newExpense.category_name}, ${newExpense.title}, ${newExpense.amount}, ${newExpense.receipt_image_url || null}, ${newExpense.source}, ${newExpense.split_type}, ${assignedJson}::jsonb)
        `;

        if (categoryId) {
          await sql`
            UPDATE budget_categories
            SET spent_amount = spent_amount + ${expenseAmount}
            WHERE id = ${categoryId}
          `;
        }

        const sourceLabel = source === 'MEMBER_REIMBURSE' ? `ditalangi oleh ${newExpense.paid_by_name}` : 'dari kas bersama';
        await sql`
          INSERT INTO activities (id, group_id, actor_name, action, amount)
          VALUES (${`act-${Date.now()}`}, ${groupId}, ${newExpense.paid_by_name || 'Member'}, ${`mencatat pengeluaran "${newExpense.title}" sebesar ${formatIDR(newExpense.amount)} (${sourceLabel})`}, ${newExpense.amount})
        `;

        return NextResponse.json({ success: true, expense: newExpense });
      } catch (err) {
        console.warn('Neon expense insert error, using memoryStore:', err);
      }
    }

    const group = memoryStore.groups.get(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Grup tidak valid' }, { status: 404 });
    }

    const members = memoryStore.members.get(groupId) || [];
    const payer = members.find((m) => m.id === paidByMemberId);
    const categories = memoryStore.categories.get(groupId) || [];
    const category = categories.find((c) => c.id === categoryId);

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      group_id: groupId,
      paid_by_member_id: paidByMemberId,
      paid_by_name: payer ? payer.name : 'Kas Bersama',
      category_id: categoryId,
      category_name: category ? category.name : 'Pengeluaran Lapangan',
      title: title || 'Belanja On-site',
      amount: expenseAmount,
      receipt_image_url: receiptImageUrl,
      source: source || 'POOL_FUND',
      split_type: splitType || 'ALL',
      assigned_member_ids: assignedMemberIds || [],
      created_at: new Date().toISOString(),
    };

    if (category) {
      category.spent_amount = (category.spent_amount || 0) + expenseAmount;
    }

    const existingExpenses = memoryStore.expenses.get(groupId) || [];
    memoryStore.expenses.set(groupId, [newExpense, ...existingExpenses]);

    // Log Activity
    const activities = memoryStore.activities.get(groupId) || [];
    const sourceLabel = source === 'MEMBER_REIMBURSE' ? `ditalangi oleh ${newExpense.paid_by_name}` : 'dari kas bersama';
    memoryStore.activities.set(groupId, [
      {
        id: `act-${Date.now()}`,
        group_id: groupId,
        actor_name: newExpense.paid_by_name || 'Member',
        action: `mencatat pengeluaran "${newExpense.title}" sebesar ${formatIDR(newExpense.amount)} (${sourceLabel})`,
        timestamp: new Date().toISOString(),
        amount: newExpense.amount,
      },
      ...activities,
    ]);

    return NextResponse.json({ success: true, expense: newExpense });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
