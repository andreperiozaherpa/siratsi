import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canReadIncident, requireAccess } from '../../../../access';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const { id } = await params;
    if (!(await canReadIncident(access, id))) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    const { results } = await env.DB!.prepare(`SELECT a.action,a.detail,a.created_at,u.name AS actor
      FROM audit_logs a JOIN users u ON u.id=a.actor_id WHERE a.incident_id=? ORDER BY a.created_at DESC LIMIT 100`).bind(id).all();
    return NextResponse.json(results, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { console.error('Load audit failed', error); return NextResponse.json({ error: 'Riwayat audit belum dapat dimuat.' }, { status: 503 }); }
}
