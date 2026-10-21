import { NextResponse } from 'next/server';
import { getDb, memoryStore } from '@/lib/db';
import { Group, Member, BudgetCategory, PaymentProof, Expense, ActivityFeedItem } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sql = getDb();
  const token = searchParams.get('token');
  const userEmail = searchParams.get('email');
  let reqGroupId = searchParams.get('groupId');

  let group: Group | null = null;
  let members: Member[] = [];
  let categories: BudgetCategory[] = [];
  let proofs: PaymentProof[] = [];
  let expenses: Expense[] = [];
  let activities: ActivityFeedItem[] = [];

  // If token is provided, resolve group directly from token
  if (token && sql) {
    try {
      // 1. Check if token belongs to coordinator
      const coordGroup = await sql`SELECT * FROM groups WHERE coordinator_token = ${token} LIMIT 1`;
      if (coordGroup.length > 0) {
        group = coordGroup[0] as unknown as Group;
        reqGroupId = group.id;
      } else {
        // 2. Check if token belongs to member
        const memRes = await sql`SELECT group_id FROM members WHERE member_token = ${token} LIMIT 1`;
        if (memRes.length > 0) {
          reqGroupId = memRes[0].group_id as string;
          const gRes = await sql`SELECT * FROM groups WHERE id = ${reqGroupId} LIMIT 1`;
          if (gRes.length > 0) group = gRes[0] as unknown as Group;
        }
      }
    } catch (err) {
      console.warn('Neon token lookup error:', err);
    }
  }

  // If email is provided, check if member is already linked to this email (only when token not given)
  if (userEmail && sql && !token && !group) {
    try {
      const emailMem = await sql`SELECT group_id, member_token FROM members WHERE LOWER(email) = ${userEmail.toLowerCase()} ORDER BY created_at DESC LIMIT 1`;
      if (emailMem.length > 0) {
        reqGroupId = emailMem[0].group_id as string;
      }
    } catch (err) {
      console.warn('Neon email lookup error:', err);
    }
  }

  // Fallback to memoryStore token / email lookup
  if (!group) {
    for (const [gid, g] of memoryStore.groups.entries()) {
      if (token && g.coordinator_token === token) {
        group = g;
        reqGroupId = gid;
        break;
      }
      const mems = memoryStore.members.get(gid) || [];
      if (token && mems.some((m) => m.member_token === token)) {
        group = g;
        reqGroupId = gid;
        break;
      }
      if (userEmail && mems.some((m) => m.email === userEmail)) {
        group = g;
        reqGroupId = gid;
        break;
      }
    }
  }

  // Fallback to reqGroupId if still not resolved
  const activeGroupId = reqGroupId || 'demo-glamping';

  if (!group && sql) {
    try {
      const gRes = await sql`SELECT * FROM groups WHERE id = ${activeGroupId} LIMIT 1`;
      if (gRes.length > 0) group = gRes[0] as unknown as Group;
    } catch (err) {
      console.warn('Neon query error:', err);
    }
  }

  if (sql && group) {
    try {
      const [mRes, cRes, pRes, eRes, aRes] = await Promise.all([
        sql`SELECT * FROM members WHERE group_id = ${group.id} ORDER BY created_at ASC`,
        sql`SELECT * FROM budget_categories WHERE group_id = ${group.id} ORDER BY created_at ASC`,
        sql`SELECT * FROM payment_proofs WHERE group_id = ${group.id} ORDER BY submitted_at DESC`,
        sql`SELECT * FROM expenses WHERE group_id = ${group.id} ORDER BY created_at DESC`,
        sql`SELECT * FROM activities WHERE group_id = ${group.id} ORDER BY timestamp DESC LIMIT 20`,
      ]);
      members = (mRes as unknown as Member[]).map((m) => ({
        ...m,
        target_quota: Number(m.target_quota) || 0,
        paid_amount: Number(m.paid_amount) || 0,
      }));
      categories = (cRes as unknown as BudgetCategory[]).map((c) => ({
        ...c,
        allocated_amount: Number(c.allocated_amount) || 0,
        spent_amount: Number(c.spent_amount) || 0,
      }));
      proofs = (pRes as unknown as PaymentProof[]).map((p) => ({
        ...p,
        amount: Number(p.amount) || 0,
      }));
      expenses = (eRes as unknown as Expense[]).map((e) => ({
        ...e,
        amount: Number(e.amount) || 0,
        assigned_member_ids: Array.isArray(e.assigned_member_ids)
          ? e.assigned_member_ids
          : typeof e.assigned_member_ids === 'string'
          ? JSON.parse(e.assigned_member_ids)
          : [],
      }));
      activities = (aRes as unknown as ActivityFeedItem[]).map((a) => ({
        ...a,
        amount: a.amount ? Number(a.amount) : undefined,
      }));
    } catch (err) {
      console.warn('Neon query relations error:', err);
    }
  }

  // Fallback to memoryStore
  if (!group) {
    const fallbackId = memoryStore.groups.has(activeGroupId) ? activeGroupId : 'demo-glamping';
    group = memoryStore.groups.get(fallbackId) || null;
    if (!group) {
      return NextResponse.json({ error: 'Group tidak ditemukan' }, { status: 404 });
    }
    members = memoryStore.members.get(fallbackId) || [];
    categories = memoryStore.categories.get(fallbackId) || [];
    proofs = memoryStore.proofs.get(fallbackId) || [];
    expenses = memoryStore.expenses.get(fallbackId) || [];
    activities = memoryStore.activities.get(fallbackId) || [];
  }

  // Determine role based on token or email
  let currentMember: Member | null = null;
  let isCoordinator = false;

  if (token) {
    if (token === group.coordinator_token) {
      isCoordinator = true;
      currentMember = members.find((m) => m.role === 'COORDINATOR') || null;
    } else {
      currentMember = members.find((m) => m.member_token === token) || null;
    }
  } else if (userEmail) {
    const matched = members.find((m) => m.email?.toLowerCase() === userEmail.toLowerCase());
    if (matched) {
      currentMember = matched;
      isCoordinator = matched.role === 'COORDINATOR';
    }
  }

  // Calculate stats
  const totalTarget = Number(group.target_amount) || 0;
  const currentTotal = Number(group.current_amount) || 0;
  const progressPercent = totalTarget > 0 ? Math.min(100, Math.round((currentTotal / totalTarget) * 100)) : 0;
  const pendingCount = proofs.filter((p) => p.status === 'PENDING').length;
  const poolExpenses = expenses
    .filter((e) => e.source === 'POOL_FUND')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remainingCash = Math.max(0, currentTotal - poolExpenses);

  // ponytail: Sanitize tokens to prevent leakage to non-coordinators
  const sanitizedGroup = {
    ...group,
    coordinator_token: isCoordinator ? group.coordinator_token : '',
  };

  const sanitizedMembers = members.map((m) => ({
    ...m,
    member_token: isCoordinator || currentMember?.id === m.id ? m.member_token : '',
  }));

  return NextResponse.json({
    group: sanitizedGroup,
    members: sanitizedMembers,
    categories,
    proofs,
    expenses,
    activities,
    stats: {
      totalTarget,
      currentTotal,
      remainingCash,
      progressPercent,
      pendingCount,
      remainingAmount: Math.max(0, totalTarget - currentTotal),
    },
    auth: {
      isCoordinator,
      currentMember,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, location, trip_date, members: memberNames, categories: rawCats, qris_image_url } = body;

    const id = `trip-${Date.now().toString(36)}`;
    const coordToken = `coord_${Math.random().toString(36).substring(2, 10)}`;
    const inviteCode = `GLAMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Calculate budget sum
    const categories: BudgetCategory[] = (rawCats || []).map((cat: { name: string; amount: number }, i: number) => ({
      id: `cat-${id}-${i}`,
      group_id: id,
      name: cat.name,
      allocated_amount: Number(cat.amount) || 0,
      spent_amount: 0,
      created_at: new Date().toISOString(),
    }));

    const totalTarget = categories.reduce((sum, c) => sum + c.allocated_amount, 0);
    const memberCount = Math.max(1, (memberNames || []).length);
    // ponytail: integer division remainder added to coordinator so sum(quota) == totalTarget exactly
    const baseQuota = Math.floor(totalTarget / memberCount);
    const remainder = totalTarget % memberCount;

    const colors = ['#2D5A27', '#E07A5F', '#3D5A80', '#81B29A', '#DDA15E', '#BC6C25', '#606C38', '#588157'];

    const members: Member[] = (memberNames || []).map((mName: string, i: number) => {
      const isLead = i === 0;
      return {
        id: `m-${id}-${i}`,
        group_id: id,
        name: mName,
        role: isLead ? 'COORDINATOR' : 'MEMBER',
        member_token: isLead ? coordToken : `mem_${Math.random().toString(36).substring(2, 10)}`,
        target_quota: isLead ? baseQuota + remainder : baseQuota,
        paid_amount: 0,
        avatar_color: colors[i % colors.length],
        created_at: new Date().toISOString(),
      };
    });

    const newGroup: Group = {
      id,
      name: name || 'Glamping Trip Baru',
      description: description || '',
      location: location || 'Bandung',
      trip_date: trip_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      target_amount: totalTarget,
      current_amount: 0,
      bank_account_details: body.bank_account_details || 'BCA 8040192831 a/n Bendahara',
      qris_image_url: qris_image_url || 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
      coordinator_token: coordToken,
      invite_code: inviteCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sql = getDb();
    if (sql) {
      await sql`
        INSERT INTO groups (id, name, description, location, trip_date, target_amount, current_amount, bank_account_details, qris_image_url, coordinator_token, invite_code)
        VALUES (${newGroup.id}, ${newGroup.name}, ${newGroup.description}, ${newGroup.location}, ${newGroup.trip_date}, ${newGroup.target_amount}, ${newGroup.current_amount}, ${newGroup.bank_account_details || null}, ${newGroup.qris_image_url}, ${newGroup.coordinator_token}, ${newGroup.invite_code})
      `;
      for (const cat of categories) {
        await sql`
          INSERT INTO budget_categories (id, group_id, name, allocated_amount, spent_amount)
          VALUES (${cat.id}, ${cat.group_id}, ${cat.name}, ${cat.allocated_amount}, 0)
        `;
      }
      for (const m of members) {
        const mEmail = m.role === 'COORDINATOR' && body.coordinatorEmail ? body.coordinatorEmail.toLowerCase() : (m.email || null);
        await sql`
          INSERT INTO members (id, group_id, name, email, role, member_token, target_quota, paid_amount, avatar_color)
          VALUES (${m.id}, ${m.group_id}, ${m.name}, ${mEmail}, ${m.role}, ${m.member_token}, ${m.target_quota}, ${m.paid_amount}, ${m.avatar_color})
        `;
      }
      await sql`
        INSERT INTO activities (id, group_id, actor_name, action, amount)
        VALUES (${`act-${Date.now()}`}, ${newGroup.id}, ${members[0]?.name || 'Koordinator'}, ${`membuat trip "${newGroup.name}" dengan target ${totalTarget}`}, ${totalTarget})
      `;
    }

    memoryStore.groups.set(id, newGroup);
    memoryStore.categories.set(id, categories);
    memoryStore.members.set(id, members);
    memoryStore.proofs.set(id, []);
    memoryStore.expenses.set(id, []);
    memoryStore.activities.set(id, [
      {
        id: `act-${Date.now()}`,
        group_id: id,
        actor_name: members[0]?.name || 'Koordinator',
        action: `membuat trip "${newGroup.name}" dengan target ${totalTarget}`,
        timestamp: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      group: newGroup,
      coordinator_token: coordToken,
      coordinator_url: `/?groupId=${id}&token=${coordToken}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
