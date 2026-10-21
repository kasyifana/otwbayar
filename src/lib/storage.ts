import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Handle image uploads.
 * 1. Neon Object Storage (S3-compatible) when AWS_ENDPOINT_URL_S3 is set -> routed through /api/storage/
 * 2. Vercel Blob if configured
 * 3. Base64 data URL fallback
 */
export async function uploadImage(file: File, prefix: string = 'proof'): Promise<string> {
  const s3Endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (s3Endpoint && accessKeyId && secretAccessKey) {
    try {
      const s3 = new S3Client({
        region: process.env.AWS_REGION || 'ap-southeast-1',
        endpoint: s3Endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split('.').pop() || 'jpg';
      const key = `${prefix}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const bucket = process.env.AWS_BUCKET_NAME || 'assets';

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: file.type || 'image/jpeg',
        })
      );

      // Return public proxy URL to stream safely without presigned URL expiry
      return `/api/storage/${key}`;
    } catch (err) {
      console.error('Neon Object Storage upload failed, falling back:', err);
    }
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      const { put } = await import('@vercel/blob');
      const filename = `${prefix}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const blob = await put(filename, file, {
        access: 'public',
        token,
      });
      return blob.url;
    } catch (e) {
      console.warn('Vercel blob upload failed, falling back to base64', e);
    }
  }

  // Fallback
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = file.type || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}
