import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../../../../access';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const access = await requireAccess();
  if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const { id, documentId } = await params;
  if (access.role === 'external_stakeholder') return NextResponse.json({ error: 'Lampiran tidak ditemukan.' }, { status: 404 });
  const row = await env.DB!.prepare('SELECT object_key AS objectKey, content_type AS contentType FROM approval_documents WHERE id = ? AND incident_id = ?').bind(documentId, id).first<{ objectKey: string; contentType: string }>();
  if (!row || !env.BUCKET) return NextResponse.json({ error: 'Lampiran tidak ditemukan.' }, { status: 404 });
  const object = await env.BUCKET.get(row.objectKey);
  if (!object) return NextResponse.json({ error: 'Lampiran tidak ditemukan.' }, { status: 404 });
  return new Response(object.body, { headers: { 'Content-Type': row.contentType, 'Content-Disposition': 'inline', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
