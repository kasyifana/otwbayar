import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prefix = (formData.get('prefix') as string) || 'receipt';

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Limit check: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file melebihi 5MB' }, { status: 400 });
    }

    // MIME type check
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (file.type && !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipe file harus berupa gambar (JPG, PNG, WebP)' }, { status: 400 });
    }

    const url = await uploadImage(file, prefix);
    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
