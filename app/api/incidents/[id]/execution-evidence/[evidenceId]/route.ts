import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canReadIncident, requireAccess } from '../../../../../access';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; evidenceId: string }> }) {
  const access = await requireAccess();
  if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const { id, evidenceId } = await params;
  if (!(await canReadIncident(access, id))) return NextResponse.json({ error: 'Bukti pelaksanaan tidak ditemukan.' }, { status: 404 });
  const row = await env.DB!.prepare('SELECT object_key AS objectKey,content_type AS contentType FROM execution_evidence WHERE id=? AND incident_id=?').bind(evidenceId, id).first<{ objectKey: string; contentType: string }>();
  const object = row && env.BUCKET ? await env.BUCKET.get(row.objectKey) : null;
  if (!row || !object) return NextResponse.json({ error: 'Bukti pelaksanaan tidak ditemukan.' }, { status: 404 });
  return new Response(object.body, { headers: { 'Content-Type': row.contentType, 'Content-Disposition': 'inline', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
