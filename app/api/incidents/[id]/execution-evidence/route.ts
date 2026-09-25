import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canReadIncident, requireAccess } from '../../../../access';

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_FILES = 10;
const accepted = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const valid = (type: string, bytes: Uint8Array) =>
  (type === 'application/pdf' && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-') ||
  (type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
  (type === 'image/png' && bytes.slice(0, 4).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47][index])) ||
  (type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP');

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAccess();
  if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const { id } = await params;
  if (!(await canReadIncident(access, id))) return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
  const { results } = await env.DB!.prepare('SELECT id,filename,content_type AS contentType,size_bytes AS sizeBytes,created_at AS createdAt FROM execution_evidence WHERE incident_id=? ORDER BY created_at DESC').bind(id).all();
  return NextResponse.json(results, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const { id } = await params;
    const incident = await env.DB!.prepare('SELECT stage FROM incidents WHERE id=?').bind(id).first<{ stage: number }>();
    if (!incident || access.role !== 'response_executor' || incident.stage !== 4 || !(await canReadIncident(access, id))) return NextResponse.json({ error: 'Bukti pelaksanaan hanya dapat diunggah oleh Pelaksana Respons yang ditugaskan.' }, { status: 403 });
    if (!env.BUCKET || Number(request.headers.get('content-length') || 0) > MAX_BYTES + 64 * 1024) return NextResponse.json({ error: 'Ukuran file maksimal 15 MB.' }, { status: 413 });
    const file = (await request.formData()).get('evidence');
    if (!(file instanceof File) || !accepted.has(file.type) || file.size < 4 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Pilih PDF, JPG, PNG, atau WebP maksimal 15 MB.' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!valid(file.type, bytes)) return NextResponse.json({ error: 'Format isi file tidak sesuai.' }, { status: 400 });
    const count = await env.DB!.prepare('SELECT COUNT(*) AS total FROM execution_evidence WHERE incident_id=?').bind(id).first<{ total: number }>();
    if ((count?.total || 0) >= MAX_FILES) return NextResponse.json({ error: 'Maksimal 10 berkas bukti pelaksanaan.' }, { status: 400 });
    const evidenceId = crypto.randomUUID(); const objectKey = `execution-evidence/${id}/${evidenceId}`;
    await env.BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: file.type } });
    try { await env.DB!.prepare('INSERT INTO execution_evidence (id,incident_id,object_key,filename,content_type,size_bytes,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(evidenceId, id, objectKey, file.name.slice(0, 180), file.type, file.size, access.id, new Date().toISOString()).run(); }
    catch (error) { await env.BUCKET.delete(objectKey); throw error; }
    return NextResponse.json({ id: evidenceId }, { status: 201 });
  } catch (error) { console.error('Execution evidence upload failed', error); return NextResponse.json({ error: 'Bukti pelaksanaan belum berhasil diunggah.' }, { status: 503 }); }
}
