import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually for script
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
}

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not found');
  }
  const sql = neon(dbUrl);
  const schema = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/schema.sql'), 'utf-8');
  
  console.log('Running migration on Neon Postgres...');
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
  }

  // Ensure new columns are present on existing tables
  try {
    await sql.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS bank_account_details TEXT DEFAULT 'BCA 8040192831 a/n Bendahara'`);
    await sql.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS split_type TEXT NOT NULL DEFAULT 'ALL'`);
    await sql.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS assigned_member_ids JSONB DEFAULT '[]'::jsonb`);
  } catch (err) {
    console.warn('Column alter notice:', err);
  }

  console.log('Migration completed successfully!');

  // Seed demo group if empty
  const existing = await sql`SELECT id FROM groups LIMIT 1`;
  if (existing.length === 0) {
    console.log('Seeding demo data into Neon...');
    const groupId = 'demo-glamping';
    await sql`
      INSERT INTO groups (id, name, description, location, trip_date, target_amount, current_amount, qris_image_url, coordinator_token, invite_code)
      VALUES (
        ${groupId},
        'Glamping Riverside Ciwidey',
        'Trip akhir pekan bareng squad 7 orang: campfire, BBQ daging wagyu, sejuknya pinus & river tubing!',
        'Ciwidey, Bandung Selatan',
        '2025-06-20',
        5600000,
        3920000,
        'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
        'coord_sarah_ciwidey77',
        'GLAMP-CIWIDEY'
      )
    `;

    const categories = [
      ['cat-1', groupId, 'Sewa Tenda Safari Glamping (2 Tenda)', 2800000, 2800000],
      ['cat-2', groupId, 'Paket BBQ Wagyu & Jagung Bakar', 1400000, 850000],
      ['cat-3', groupId, 'Bensin & Tol 2 Mobil', 1050000, 400000],
      ['cat-4', groupId, 'Dana Darurat & Snack Lapangan', 350000, 80000],
    ];
    for (const [id, gid, name, alloc, spent] of categories) {
      await sql`
        INSERT INTO budget_categories (id, group_id, name, allocated_amount, spent_amount)
        VALUES (${id as string}, ${gid as string}, ${name as string}, ${alloc as number}, ${spent as number})
      `;
    }

    const members = [
      ['m-1', groupId, 'Sarah (Bendahara)', 'sarah@example.com', 'COORDINATOR', 'coord_sarah_ciwidey77', 800000, 800000, '#2D5A27'],
      ['m-2', groupId, 'Dimas Ardi', 'dimas@example.com', 'MEMBER', 'mem_dimas_k91x', 800000, 800000, '#E07A5F'],
      ['m-3', groupId, 'Nadya Putri', 'nadya@example.com', 'MEMBER', 'mem_nadya_p42v', 800000, 800000, '#3D5A80'],
      ['m-4', groupId, 'Reza Pratama', 'reza@example.com', 'MEMBER', 'mem_reza_r88m', 800000, 800000, '#81B29A'],
      ['m-5', groupId, 'Fikri Haikal', 'fikri@example.com', 'MEMBER', 'mem_fikri_f19s', 800000, 400000, '#DDA15E'],
      ['m-6', groupId, 'Alika Zahra', 'alika@example.com', 'MEMBER', 'mem_alika_a77u', 800000, 320000, '#BC6C25'],
      ['m-7', groupId, 'Genta Arya', 'genta@example.com', 'MEMBER', 'mem_genta_g33t', 800000, 0, '#606C38'],
    ];
    for (const [id, gid, name, email, role, token, quota, paid, color] of members) {
      await sql`
        INSERT INTO members (id, group_id, name, email, role, member_token, target_quota, paid_amount, avatar_color)
        VALUES (${id as string}, ${gid as string}, ${name as string}, ${email as string}, ${role as string}, ${token as string}, ${quota as number}, ${paid as number}, ${color as string})
      `;
    }

    console.log('Seed completed successfully!');
  }
}

migrate().catch(console.error);
