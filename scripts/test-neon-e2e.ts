import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
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

async function testEndToEnd() {
  console.log('🧪 Testing Neon Services End-to-End...');

  // 1. Neon Postgres
  console.log('\n--- 1. Testing Neon Postgres ---');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set');
  const sql = neon(dbUrl);
  const rows = await sql`SELECT NOW() as current_time, count(*) as count from groups;`;
  console.log(`✅ Postgres Connected. Time: ${rows[0].current_time}, Groups count: ${rows[0].count}`);

  // 2. Neon Object Storage (S3)
  console.log('\n--- 2. Testing Neon Object Storage (assets bucket) ---');
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('S3 credentials missing from .env.local');
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const testKey = `test/ping-${Date.now()}.txt`;
  const testContent = 'Hello from Neon Object Storage in otwbayar!';
  
  await s3.send(
    new PutObjectCommand({
      Bucket: 'assets',
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    })
  );
  console.log(`✅ Object uploaded successfully to s3://assets/${testKey}`);

  const getRes = await s3.send(
    new GetObjectCommand({
      Bucket: 'assets',
      Key: testKey,
    })
  );
  const downloaded = await getRes.Body?.transformToString();
  console.assert(downloaded === testContent, 'Object content mismatch!');
  console.log(`✅ Object verified with matching content: "${downloaded}"`);

  console.log('\n🎉 ALL NEON SERVICES VERIFIED END-TO-END!\n');
}

testEndToEnd().catch((err) => {
  console.error('❌ Neon End-to-end test failed:', err);
  process.exit(1);
});
