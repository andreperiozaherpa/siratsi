import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canReadIncident, requireAccess } from '../../../access';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const { id } = await params;
    const row = await env.DB!.prepare('SELECT updated_at AS updatedAt FROM incidents WHERE id = ?').bind(id).first<{ updatedAt: string }>();
    if (!row || !(await canReadIncident(access, id))) return NextResponse.json({ error: 'Notifikasi tidak ditemukan.' }, { status: 404 });
    const body = await request.json() as { updatedAt?: unknown };
    if (body.updatedAt !== row.updatedAt) return NextResponse.json({ error: 'Ada pembaruan baru. Muat ulang notifikasi.' }, { status: 409 });
    await env.DB!.prepare(`INSERT INTO notification_reads (user_id, incident_id, last_seen_updated_at) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE last_seen_updated_at = IF(last_seen_updated_at < VALUES(last_seen_updated_at), VALUES(last_seen_updated_at), last_seen_updated_at)`)
      .bind(access.id, id, row.updatedAt).run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mark notification read failed', error);
    return NextResponse.json({ error: 'Status notifikasi belum tersimpan.' }, { status: 503 });
  }
}
