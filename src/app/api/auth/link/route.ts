import { NextResponse } from 'next/server';
import { getDb, memoryStore } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const { token } = await request.json();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Harap masuk dengan Google terlebih dahulu' }, { status: 401 });
    }

    if (!token) {
      return NextResponse.json({ error: 'Token harus diisi' }, { status: 400 });
    }

    const normalizedEmail = session.user.email.toLowerCase().trim();
    const sql = getDb();

    // 1. Check in Neon database
    if (sql) {
      try {
        // Find member with this token
        const memberRes = await sql`SELECT id, group_id, name, email FROM members WHERE member_token = ${token} LIMIT 1`;
        if (memberRes.length > 0) {
          const mem = memberRes[0];
          await sql`UPDATE members SET email = ${normalizedEmail} WHERE id = ${mem.id}`;
          return NextResponse.json({
            success: true,
            groupId: mem.group_id,
            memberName: mem.name,
            email: normalizedEmail,
          });
        }

        // Check if token is coordinator_token in groups
        const groupRes = await sql`SELECT id, name FROM groups WHERE coordinator_token = ${token} LIMIT 1`;
        if (groupRes.length > 0) {
          const grp = groupRes[0];
          // Update coordinator member's email
          await sql`UPDATE members SET email = ${normalizedEmail} WHERE group_id = ${grp.id} AND role = 'COORDINATOR'`;
          return NextResponse.json({
            success: true,
            groupId: grp.id,
            isCoordinator: true,
            email: normalizedEmail,
          });
        }
      } catch (err) {
        console.warn('Neon link account error:', err);
      }
    }

    // 2. Fallback memoryStore update
    for (const [gid, mems] of memoryStore.members.entries()) {
      const memIndex = mems.findIndex((m) => m.member_token === token);
      if (memIndex !== -1) {
        mems[memIndex].email = normalizedEmail;
        return NextResponse.json({
          success: true,
          groupId: gid,
          memberName: mems[memIndex].name,
          email: normalizedEmail,
        });
      }
    }

    // Check memoryStore coordinator token
    for (const [gid, g] of memoryStore.groups.entries()) {
      if (g.coordinator_token === token) {
        const mems = memoryStore.members.get(gid) || [];
        const coord = mems.find((m) => m.role === 'COORDINATOR');
        if (coord) {
          coord.email = normalizedEmail;
        }
        return NextResponse.json({
          success: true,
          groupId: gid,
          isCoordinator: true,
          email: normalizedEmail,
        });
      }
    }

    return NextResponse.json({ error: 'Token tidak valid' }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
