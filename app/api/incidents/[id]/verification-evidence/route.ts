import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canManageCase, canReadIncident, requireAccess } from '../../../../access';

type Context = { params: Promise<{ id: string }> };
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_FILES = 8;
const accepted = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/wav']);

function hasValidSignature(type: string, bytes: Uint8Array) {
  if (type === 'application/pdf') return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.slice(0, 4).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47][index]);
  if (type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (type === 'video/mp4') return String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp';
  if (type === 'audio/mpeg') return bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  if (type === 'audio/wav') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WAVE';
  return false;
}

export async function GET(_request: Request, { params }: Context) {
  const access = await requireAccess();
  if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const { id } = await params;
  if (!(await canReadIncident(access, id))) return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
  const { results } = await env.DB!.prepare('SELECT id, filename, content_type AS contentType, size_bytes AS sizeBytes, created_at AS createdAt FROM verification_evidence WHERE incident_id = ? ORDER BY created_at DESC').bind(id).all();
  return NextResponse.json(results, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request, { params }: Context) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    if (!canManageCase(access)) return NextResponse.json({ error: 'Akses unggah ditolak.' }, { status: 403 });
    const { id } = await params;
    const incident = await env.DB!.prepare('SELECT stage FROM incidents WHERE id = ?').bind(id).first<{ stage: number }>();
    if (!incident) return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
    if (incident.stage !== 0) return NextResponse.json({ error: 'Bukti pendukung hanya dapat ditambahkan pada Tahap 1 Verifikasi.' }, { status: 409 });
    if (!env.BUCKET) return NextResponse.json({ error: 'Penyimpanan lampiran belum tersedia.' }, { status: 503 });
    if (Number(request.headers.get('content-length') || 0) > MAX_BYTES + 64 * 1024) return NextResponse.json({ error: 'Ukuran file maksimal 15 MB.' }, { status: 413 });
    const form = await request.formData();
    const file = form.get('evidence');
    if (!(file instanceof File) || !accepted.has(file.type) || file.size < 4 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Pilih PDF, foto, video MP4, atau rekaman audio maksimal 15 MB.' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasValidSignature(file.type, bytes)) return NextResponse.json({ error: 'Format isi file tidak sesuai.' }, { status: 400 });
    const count = await env.DB!.prepare('SELECT COUNT(*) AS total FROM verification_evidence WHERE incident_id = ?').bind(id).first<{ total: number }>();
    if ((count?.total || 0) >= MAX_FILES) return NextResponse.json({ error: 'Maksimal 8 bukti pendukung per informasi.' }, { status: 400 });
    const evidenceId = crypto.randomUUID();
    const objectKey = `verification-evidence/${id}/${evidenceId}`;
    await env.BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: file.type } });
    try {
      await env.DB!.prepare('INSERT INTO verification_evidence (id,incident_id,object_key,filename,content_type,size_bytes,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?)')
        .bind(evidenceId, id, objectKey, file.name.slice(0, 180), file.type, file.size, access.id, new Date().toISOString()).run();
    } catch (error) { await env.BUCKET.delete(objectKey); throw error; }
    return NextResponse.json({ id: evidenceId }, { status: 201 });
  } catch (error) {
    console.error('Verification evidence upload failed', error);
    return NextResponse.json({ error: 'Bukti pendukung belum berhasil diunggah.' }, { status: 503 });
  }
}
