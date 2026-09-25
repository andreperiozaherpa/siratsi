import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../../../../access';
import { recordAudit } from '@/app/audit';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; escalationId: string }> }) {
  try {
    const access = await requireAccess();
    if (!access || !['leader_approver', 'super_admin'].includes(access.role)) return NextResponse.json({ error: 'Hanya pimpinan atau Super Admin yang dapat menyelesaikan eskalasi.' }, { status: 403 });
    const { id, escalationId } = await params;
    const body = await request.json() as { resolutionNote?: unknown };
    const note = String(body.resolutionNote || '').trim();
    if (!note || note.length > 2000) return NextResponse.json({ error: 'Isi catatan penyelesaian, maksimal 2.000 karakter.' }, { status: 400 });
    if (access.role === 'leader_approver') {
      const recipient = await env.DB!.prepare('SELECT 1 FROM incident_escalation_recipients WHERE escalation_id=? AND user_id=?').bind(escalationId, access.id).first();
      if (!recipient) return NextResponse.json({ error: 'Eskalasi tidak ditujukan kepada Anda.' }, { status: 403 });
    }
    const now = new Date().toISOString();
    const update = await env.DB!.prepare("UPDATE incident_escalations SET status='resolved',resolved_at=?,resolved_by=?,resolution_note=? WHERE id=? AND incident_id=? AND status='active'")
      .bind(now, access.id, note, escalationId, id).run();
    if (!update.meta.changes) return NextResponse.json({ error: 'Eskalasi tidak ditemukan atau sudah selesai.' }, { status: 404 });
    await recordAudit(id, access.id, 'Eskalasi diselesaikan', note);
    return NextResponse.json({ ok: true });
  } catch (error) { console.error('Resolve escalation failed', error); return NextResponse.json({ error: 'Eskalasi belum dapat diselesaikan.' }, { status: 503 }); }
}
