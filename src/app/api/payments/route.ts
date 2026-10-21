import { NextResponse } from 'next/server';
import { getDb, memoryStore } from '@/lib/db';
import { PaymentProof } from '@/types';
import { sendEmail } from '@/lib/email';
import { formatIDR } from '@/lib/format';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, memberId, amount, proofImageUrl, note } = body;
    const parsedAmount = Math.floor(Number(amount));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Nominal setoran harus lebih dari Rp 0' }, { status: 400 });
    }

    const sql = getDb();

    let memberName = 'Member';
    let coordinatorEmail: string | undefined;
    let coordinatorName = 'Koordinator';

    if (sql) {
      const mRes = await sql`SELECT name FROM members WHERE id = ${memberId} LIMIT 1`;
      if (mRes.length > 0) memberName = mRes[0].name as string;
      const cRes = await sql`SELECT name, email FROM members WHERE group_id = ${groupId} AND role = 'COORDINATOR' LIMIT 1`;
      if (cRes.length > 0) {
        coordinatorName = cRes[0].name as string;
        coordinatorEmail = cRes[0].email as string;
      }
    } else {
      const group = memoryStore.groups.get(groupId);
      if (!group) {
        return NextResponse.json({ error: 'Grup tidak valid' }, { status: 404 });
      }
      const members = memoryStore.members.get(groupId) || [];
      const member = members.find((m) => m.id === memberId);
      if (!member) {
        return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
      }
      memberName = member.name;
      const coordinator = members.find((m) => m.role === 'COORDINATOR');
      if (coordinator) {
        coordinatorName = coordinator.name;
        coordinatorEmail = coordinator.email;
      }
    }

    const newProof: PaymentProof = {
      id: `proof-${Date.now()}`,
      group_id: groupId,
      member_id: memberId,
      member_name: memberName,
      amount: parsedAmount,
      proof_image_url: proofImageUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      note: note || '',
      status: 'PENDING',
      submitted_at: new Date().toISOString(),
    };

    if (sql) {
      try {
        await sql`
          INSERT INTO payment_proofs (id, group_id, member_id, member_name, amount, proof_image_url, note, status, submitted_at)
          VALUES (${newProof.id}, ${newProof.group_id}, ${newProof.member_id}, ${newProof.member_name}, ${newProof.amount}, ${newProof.proof_image_url}, ${newProof.note}, ${newProof.status}, ${newProof.submitted_at})
        `;
        await sql`
          INSERT INTO activities (id, group_id, actor_name, action, amount)
          VALUES (${`act-${Date.now()}`}, ${groupId}, ${memberName}, ${`mengunggah bukti setoran ${formatIDR(newProof.amount)} (menunggu verifikasi)`}, ${newProof.amount})
        `;
      } catch (err) {
        console.warn('Neon payment proof insert error:', err);
      }
    }

    const existingProofs = memoryStore.proofs.get(groupId) || [];
    memoryStore.proofs.set(groupId, [newProof, ...existingProofs]);

    // Record activity in memory
    const activities = memoryStore.activities.get(groupId) || [];
    memoryStore.activities.set(groupId, [
      {
        id: `act-${Date.now()}`,
        group_id: groupId,
        actor_name: memberName,
        action: `mengunggah bukti setoran ${formatIDR(newProof.amount)} (menunggu verifikasi)`,
        timestamp: new Date().toISOString(),
        amount: newProof.amount,
      },
      ...activities,
    ]);

    // Notify coordinator via email mock/resend
    if (coordinatorEmail) {
      await sendEmail({
        to: coordinatorEmail,
        subject: `[otwbayar] Ada setoran baru dari ${memberName}!`,
        html: `<p>Hai ${coordinatorName}, ${memberName} baru saja mengirimkan bukti setoran sebesar <strong>${formatIDR(newProof.amount)}</strong>.</p>`,
      });
    }

    return NextResponse.json({ success: true, proof: newProof });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { groupId, proofId, action, reviewerToken, rejectionReason } = body;
    const sql = getDb();

    if (sql) {
      const gRes = await sql`SELECT coordinator_token, current_amount FROM groups WHERE id = ${groupId} LIMIT 1`;
      if (gRes.length === 0) {
        return NextResponse.json({ error: 'Grup tidak valid' }, { status: 404 });
      }
      if (reviewerToken !== gRes[0].coordinator_token) {
        return NextResponse.json({ error: 'Hanya koordinator yang dapat memverifikasi setoran' }, { status: 403 });
      }

      const pRes = await sql`SELECT * FROM payment_proofs WHERE id = ${proofId} LIMIT 1`;
      if (pRes.length === 0) {
        return NextResponse.json({ error: 'Bukti setoran tidak ditemukan' }, { status: 404 });
      }
      const targetProof = pRes[0];
      if (targetProof.status === 'APPROVED') {
        return NextResponse.json({ error: 'Bukti transfer sudah diverifikasi sebelumnya' }, { status: 400 });
      }

      const mRes = await sql`SELECT * FROM members WHERE id = ${targetProof.member_id} LIMIT 1`;
      const member = mRes[0] || null;

      if (action === 'APPROVE') {
        // Atomic status update to avoid double-credit race condition
        const updatedRes = await sql`
          UPDATE payment_proofs
          SET status = 'APPROVED', reviewed_at = NOW(), reviewed_by = ${reviewerToken}
          WHERE id = ${proofId} AND status = 'PENDING'
          RETURNING *
        `;
        if (updatedRes.length === 0) {
          return NextResponse.json({ error: 'Bukti transfer sudah diproses atau status bukan PENDING' }, { status: 409 });
        }

        const approvedProof = updatedRes[0];
        const approvedAmount = Number(approvedProof.amount) || 0;

        if (member) {
          await sql`
            UPDATE members
            SET paid_amount = paid_amount + ${approvedAmount}
            WHERE id = ${approvedProof.member_id}
          `;
        }
        await sql`
          UPDATE groups
          SET current_amount = current_amount + ${approvedAmount}
          WHERE id = ${groupId}
        `;
        await sql`
          INSERT INTO activities (id, group_id, actor_name, action, amount)
          VALUES (${`act-${Date.now()}`}, ${groupId}, 'Koordinator', ${`menyetujui setoran ${formatIDR(approvedAmount)} dari ${approvedProof.member_name}`}, ${approvedAmount})
        `;

        if (member?.email) {
          await sendEmail({
            to: member.email,
            subject: `[otwbayar] Setoranmu ${formatIDR(approvedAmount)} disetujui!`,
            html: `<p>Hore! Setoranmu telah diverifikasi.</p>`,
          });
        }
      } else if (action === 'REJECT') {
        const reason = rejectionReason || 'Bukti transfer tidak terbaca / tidak cocok';
        const updatedRes = await sql`
          UPDATE payment_proofs
          SET status = 'REJECTED', rejection_reason = ${reason}, reviewed_at = NOW(), reviewed_by = ${reviewerToken}
          WHERE id = ${proofId} AND status = 'PENDING'
          RETURNING *
        `;
        if (updatedRes.length === 0) {
          return NextResponse.json({ error: 'Bukti transfer sudah diproses atau status bukan PENDING' }, { status: 409 });
        }

        await sql`
          INSERT INTO activities (id, group_id, actor_name, action)
          VALUES (${`act-${Date.now()}`}, ${groupId}, 'Koordinator', ${`menolak bukti transfer dari ${targetProof.member_name} (${reason})`})
        `;
      }

      return NextResponse.json({ success: true });
    }

    // In-memory fallback
    const group = memoryStore.groups.get(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Grup tidak valid' }, { status: 404 });
    }

    if (reviewerToken !== group.coordinator_token) {
      return NextResponse.json({ error: 'Hanya koordinator yang dapat memverifikasi setoran' }, { status: 403 });
    }

    const proofs = memoryStore.proofs.get(groupId) || [];
    const proofIndex = proofs.findIndex((p) => p.id === proofId);
    if (proofIndex === -1) {
      return NextResponse.json({ error: 'Bukti setoran tidak ditemukan' }, { status: 404 });
    }

    const targetProof = proofs[proofIndex];
    if (targetProof.status === 'APPROVED') {
      return NextResponse.json({ error: 'Bukti transfer sudah diverifikasi sebelumnya' }, { status: 400 });
    }
    const members = memoryStore.members.get(groupId) || [];
    const memberIndex = members.findIndex((m) => m.id === targetProof.member_id);
    const member = members[memberIndex];

    if (action === 'APPROVE') {
      if (targetProof.status !== 'PENDING') {
        return NextResponse.json({ error: 'Bukti transfer sudah diproses sebelumnya' }, { status: 409 });
      }
      targetProof.status = 'APPROVED';
      targetProof.reviewed_at = new Date().toISOString();

      if (member) {
        member.paid_amount += targetProof.amount;
      }
      group.current_amount += targetProof.amount;

      // Activity
      const activities = memoryStore.activities.get(groupId) || [];
      memoryStore.activities.set(groupId, [
        {
          id: `act-${Date.now()}`,
          group_id: groupId,
          actor_name: 'Koordinator',
          action: `menyetujui setoran ${formatIDR(targetProof.amount)} dari ${targetProof.member_name}`,
          timestamp: new Date().toISOString(),
          amount: targetProof.amount,
        },
        ...activities,
      ]);

      if (member?.email) {
        await sendEmail({
          to: member.email,
          subject: `[otwbayar] Setoranmu ${formatIDR(targetProof.amount)} disetujui!`,
          html: `<p>Hore! Setoranmu telah diverifikasi. Sisa iuran: ${formatIDR(Math.max(0, member.target_quota - member.paid_amount))}</p>`,
        });
      }
    } else if (action === 'REJECT') {
      if (targetProof.status !== 'PENDING') {
        return NextResponse.json({ error: 'Bukti transfer sudah diproses sebelumnya' }, { status: 409 });
      }
      targetProof.status = 'REJECTED';
      targetProof.rejection_reason = rejectionReason || 'Bukti transfer tidak terbaca / tidak cocok';
      targetProof.reviewed_at = new Date().toISOString();

      // Activity
      const activities = memoryStore.activities.get(groupId) || [];
      memoryStore.activities.set(groupId, [
        {
          id: `act-${Date.now()}`,
          group_id: groupId,
          actor_name: 'Koordinator',
          action: `menolak bukti transfer dari ${targetProof.member_name} (${targetProof.rejection_reason})`,
          timestamp: new Date().toISOString(),
        },
        ...activities,
      ]);
    }

    return NextResponse.json({ success: true, proof: targetProof, group, member });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
