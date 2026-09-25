import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canManageCase, canReadIncident, requireAccess } from '../../../../access';

type Context = { params: Promise<{ id: string }> };
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;

export async function GET(_request: Request, { params }: Context) {
  const access = await requireAccess();
  if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const { id } = await params;
  const incident = await env.DB!.prepare('SELECT id FROM incidents WHERE id = ?').bind(id).first();
  if (!incident || !(await canReadIncident(access, id))) return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
  const { results } = await env.DB!.prepare('SELECT id, filename, content_type AS contentType, size_bytes AS sizeBytes, created_at AS createdAt FROM stakeholder_documents WHERE incident_id = ? ORDER BY created_at DESC').bind(id).all();
  return NextResponse.json(results, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request, { params }: Context) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    if (!canManageCase(access)) return NextResponse.json({ error: 'Hanya penerima informasi internal atau Super Admin yang dapat mengunggah dokumen.' }, { status: 403 });
    const { id } = await params;
    const incident = await env.DB!.prepare('SELECT stage FROM incidents WHERE id = ?').bind(id).first<{ stage: number }>();
    if (!incident) return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
    if (incident.stage !== 2) return NextResponse.json({ error: 'Lampiran tersedia pada tahap Bagi Peran Stakeholder.' }, { status: 409 });
    if (!env.BUCKET) return NextResponse.json({ error: 'Penyimpanan lampiran belum tersedia.' }, { status: 503 });
    if (Number(request.headers.get('content-length') || 0) > MAX_BYTES + 64 * 1024) return NextResponse.json({ error: 'Ukuran file maksimal 10 MB.' }, { status: 413 });
    const form = await request.formData();
    const file = form.get('document');
    if (!(file instanceof File) || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || !file.size || file.size > MAX_BYTES) return NextResponse.json({ error: 'Pilih PDF, JPG, atau PNG maksimal 10 MB.' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid = file.type === 'application/pdf' ? String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-' : file.type === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff : bytes.slice(0, 4).every((v, i) => v === [0x89, 0x50, 0x4e, 0x47][i]);
    if (!valid) return NextResponse.json({ error: 'Format isi file tidak sesuai.' }, { status: 400 });
    const count = await env.DB!.prepare('SELECT COUNT(*) AS total FROM stakeholder_documents WHERE incident_id = ?').bind(id).first<{ total: number }>();
    if ((count?.total || 0) >= MAX_FILES) return NextResponse.json({ error: 'Maksimal 5 lampiran per kasus.' }, { status: 400 });
    const documentId = crypto.randomUUID();
    const objectKey = `stakeholder-documents/${id}/${documentId}`;
    await env.BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: file.type } });
    try {
      await env.DB!.prepare('INSERT INTO stakeholder_documents (id,incident_id,object_key,filename,content_type,size_bytes,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?)')
        .bind(documentId, id, objectKey, file.name.slice(0, 180), file.type, file.size, access.id, new Date().toISOString()).run();
    } catch (error) { await env.BUCKET.delete(objectKey); throw error; }
    return NextResponse.json({ id: documentId }, { status: 201 });
  } catch (error) { console.error('Stakeholder document upload failed', error); return NextResponse.json({ error: 'Lampiran belum berhasil diunggah.' }, { status: 503 }); }
}
