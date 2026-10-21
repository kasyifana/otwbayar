import { NextResponse } from 'next/server';
import { getDb, memoryStore } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ trips: [] });
  }

  const email = session.user.email.toLowerCase();
  const sql = getDb();
  const trips: Array<{
    groupId: string;
    groupName: string;
    location: string;
    tripDate: string;
    role: string;
    token: string;
    targetAmount: number;
    currentAmount: number;
  }> = [];

  if (sql) {
    try {
      const rows = await sql`
        SELECT 
          g.id as group_id,
          g.name as group_name,
          g.location,
          g.trip_date,
          g.target_amount,
          g.current_amount,
          m.role,
          m.member_token
        FROM members m
        JOIN groups g ON m.group_id = g.id
        WHERE LOWER(m.email) = ${email}
        ORDER BY g.trip_date ASC
      `;
      for (const r of rows) {
        trips.push({
          groupId: r.group_id as string,
          groupName: r.group_name as string,
          location: r.location as string,
          tripDate: r.trip_date as string,
          role: r.role as string,
          token: r.member_token as string,
          targetAmount: Number(r.target_amount) || 0,
          currentAmount: Number(r.current_amount) || 0,
        });
      }
    } catch (err) {
      console.warn('Neon user trips query error:', err);
    }
  }

  // Memory fallback
  if (trips.length === 0) {
    for (const [gid, members] of memoryStore.members.entries()) {
      const match = members.find((m) => m.email?.toLowerCase() === email);
      if (match) {
        const g = memoryStore.groups.get(gid);
        if (g) {
          trips.push({
            groupId: g.id,
            groupName: g.name,
            location: g.location,
            tripDate: g.trip_date,
            role: match.role,
            token: match.member_token,
            targetAmount: g.target_amount,
            currentAmount: g.current_amount,
          });
        }
      }
    }
  }

  return NextResponse.json({ trips });
}
