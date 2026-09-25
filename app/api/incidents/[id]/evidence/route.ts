import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canManageCase, canReadIncident, requireAccess } from '../../../../access';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 8;
const allowed: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const access = await requireAccess();
  if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const { id } = await params;
  const incident = await env.DB!.prepare('SELECT id FROM incidents WHERE id = ?').bind(id).first();
  if (!incident || !(await canReadIncident(access, id))) return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
  const { results } = await env.DB!.prepare('SELECT id, filename, content_type AS contentType, size_bytes AS sizeBytes, created_at AS createdAt FROM evidence_photos WHERE incident_id = ? ORDER BY created_at DESC').bind(id).all();
  return NextResponse.json(results, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request, { params }: Context) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    if (!canManageCase(access)) return NextResponse.json({ error: 'Hanya penerima informasi internal atau Super Admin yang dapat mengunggah foto.' }, { status: 403 });
    const { id } = await params;
    const incident = await env.DB!.prepare('SELECT stage FROM incidents WHERE id = ?').bind(id).first<{ stage: number }>();
    if (!incident) return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
    if (incident.stage !== 6) return NextResponse.json({ error: 'Unggah foto tersedia pada tahap Evaluasi & SOP.' }, { status: 409 });
    if (!env.BUCKET) return NextResponse.json({ error: 'Penyimpanan foto belum tersedia.' }, { status: 503 });
    const length = Number(request.headers.get('content-length') || 0);
    if (length > MAX_BYTES + 64 * 1024) return NextResponse.json({ error: 'Ukuran foto maksimal 5 MB.' }, { status: 413 });
    const form = await request.formData();
    const file = form.get('photo');
    if (!(file instanceof File) || !allowed[file.type] || file.size < 4 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Pilih foto JPG, PNG, atau WebP berukuran maksimal 5 MB.' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!allowed[file.type].every((byte, i) => bytes[i] === byte) || (file.type === 'image/webp' && String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP')) return NextResponse.json({ error: 'Format isi foto tidak sesuai.' }, { status: 400 });
    const count = await env.DB!.prepare('SELECT COUNT(*) AS total FROM evidence_photos WHERE incident_id = ?').bind(id).first<{ total: number }>();
    if ((count?.total || 0) >= MAX_PHOTOS) return NextResponse.json({ error: 'Maksimal 8 foto per kasus.' }, { status: 400 });
    const photoId = crypto.randomUUID();
    const objectKey = `evidence/${id}/${photoId}`;
    await env.BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: file.type } });
    try {
      await env.DB!.prepare('INSERT INTO evidence_photos (id, incident_id, object_key, filename, content_type, size_bytes, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(photoId, id, objectKey, file.name.slice(0, 180), file.type, file.size, access.id, new Date().toISOString()).run();
    } catch (error) { await env.BUCKET.delete(objectKey); throw error; }
    return NextResponse.json({ id: photoId }, { status: 201 });
  } catch (error) {
    console.error('Evidence upload failed', error);
    return NextResponse.json({ error: 'Foto belum berhasil diunggah. Coba lagi.' }, { status: 503 });
  }
}
