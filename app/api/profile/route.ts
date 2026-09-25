import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '@/app/access';

const MAX_BYTES = 2 * 1024 * 1024;
const signatures: Record<string, number[]> = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/webp': [0x52, 0x49, 0x46, 0x46] };

export async function GET() {
  const access = await requireAccess();
  if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const row = await env.DB!.prepare('SELECT profile_photo_key AS objectKey FROM users WHERE id=?').bind(access.id).first<{ objectKey: string | null }>();
  if (!row?.objectKey || !env.BUCKET) return NextResponse.json({ error: 'Foto profil belum tersedia.' }, { status: 404 });
  const object = await env.BUCKET.get(row.objectKey);
  if (!object) return NextResponse.json({ error: 'Foto profil belum tersedia.' }, { status: 404 });
  const contentType = row.objectKey.endsWith('.png') ? 'image/png' : row.objectKey.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  return new Response(object.body, { headers: { 'Content-Type': contentType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export async function PATCH(request: Request) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const body = await request.json() as { name?: unknown; jobTitle?: unknown };
    const name = String(body.name || '').trim(); const jobTitle = String(body.jobTitle || '').trim();
    if (!name || name.length > 150) return NextResponse.json({ error: 'Nama profil wajib diisi dan maksimal 150 karakter.' }, { status: 400 });
    if (jobTitle.length > 150) return NextResponse.json({ error: 'Jabatan maksimal 150 karakter.' }, { status: 400 });
    await env.DB!.prepare('UPDATE users SET name=?,job_title=?,updated_at=? WHERE id=?').bind(name, jobTitle, new Date().toISOString(), access.id).run();
    return NextResponse.json({ ok: true, name, jobTitle });
  } catch (error) { console.error('Update profile failed', error); return NextResponse.json({ error: 'Profil belum dapat diperbarui.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    if (Number(request.headers.get('content-length') || 0) > MAX_BYTES + 64 * 1024) return NextResponse.json({ error: 'Ukuran foto maksimal 2 MB.' }, { status: 413 });
    const file = (await request.formData()).get('photo');
    if (!(file instanceof File) || !signatures[file.type] || file.size < 4 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Pilih foto JPG, PNG, atau WebP maksimal 2 MB.' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!signatures[file.type].every((byte, index) => bytes[index] === byte) || (file.type === 'image/webp' && String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP')) return NextResponse.json({ error: 'Format isi foto tidak sesuai.' }, { status: 400 });
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const objectKey = `profile-photos/${access.id}.${extension}`;
    await env.BUCKET!.put(objectKey, bytes, { httpMetadata: { contentType: file.type } });
    await env.DB!.prepare('UPDATE users SET profile_photo_key=?,updated_at=? WHERE id=?').bind(objectKey, new Date().toISOString(), access.id).run();
    return NextResponse.json({ ok: true });
  } catch (error) { console.error('Profile photo upload failed', error); return NextResponse.json({ error: 'Foto profil belum dapat diunggah.' }, { status: 503 }); }
}
