import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

function getS3Client() {
  const s3Endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!s3Endpoint || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    endpoint: s3Endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const s3 = getS3Client();
    if (!s3) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const { path } = await params;
    const key = (path || []).join('/');
    const bucket = process.env.AWS_BUCKET_NAME || 'assets';

    const cmd = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const s3Response = await s3.send(cmd);
    const contentType = s3Response.ContentType || 'application/octet-stream';

    // Stream response back to client with cache headers
    const body = s3Response.Body as ReadableStream;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Not found';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
