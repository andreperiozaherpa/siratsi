import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canReadIncident, requireAccess } from '../../../../access';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const { id } = await params;
    if (!(await canReadIncident(access, id))) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    const { results } = await env.DB!.prepare(`SELECT e.id,e.reason,e.status,e.automatic,e.created_at AS createdAt,e.resolved_at AS resolvedAt,e.resolution_note AS resolutionNote,
      u.name AS raisedBy, r.name AS resolvedBy FROM incident_escalations e
      JOIN users u ON u.id=e.raised_by LEFT JOIN users r ON r.id=e.resolved_by
      WHERE e.incident_id=? ORDER BY e.created_at DESC`).bind(id).all();
    return NextResponse.json(results, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { console.error('Load escalations failed', error); return NextResponse.json({ error: 'Eskalasi belum dapat dimuat.' }, { status: 503 }); }
}
