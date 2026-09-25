import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../../../../access';
import { recordAudit } from '@/app/audit';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (!access || !['leader_approver', 'super_admin'].includes(access.role)) return NextResponse.json({ error: 'Hanya pimpinan yang dapat mengambil keputusan.' }, { status: 403 });
    const { id } = await params;
    const body = await request.json() as { decision?: string; note?: string };
    const decision = body.decision;
    const note = String(body.note || '').trim();
    if (!['approved', 'rejected'].includes(String(decision)) || note.length > 500 || (decision === 'rejected' && !note)) return NextResponse.json({ error: 'Isi alasan penolakan atau catatan maksimal 500 karakter.' }, { status: 400 });
    const record = await env.DB!.prepare('SELECT a.status,a.approver_id AS approverId,i.stage,i.data FROM incident_approvals a JOIN incidents i ON a.incident_id=i.id WHERE a.incident_id=?').bind(id).first<{ status: string; approverId: string; stage: number; data: string }>();
    if (!record || record.status !== 'pending' || record.stage !== 3) return NextResponse.json({ error: 'Tidak ada pengajuan yang menunggu keputusan.' }, { status: 409 });
    if (access.role !== 'super_admin' && record.approverId !== access.id) return NextResponse.json({ error: 'Pengajuan ditujukan kepada pimpinan lain.' }, { status: 403 });
    const now = new Date().toISOString();
    const updated = await env.DB!.prepare('UPDATE incident_approvals SET status=?,decided_at=?,decision_note=? WHERE incident_id=? AND status=?').bind(decision, now, note, id, 'pending').run();
    if (!updated.meta.changes) return NextResponse.json({ error: 'Keputusan sudah diproses.' }, { status: 409 });
    const data = { ...JSON.parse(record.data || '{}'), approvalStatus: decision === 'approved' ? 'Disetujui' : 'Ditolak / revisi' };
    await env.DB!.batch([
      env.DB!.prepare('UPDATE incidents SET stage=?,data=?,updated_at=? WHERE id=? AND stage=3').bind(decision === 'approved' ? 4 : 3, JSON.stringify(data), now, id),
      env.DB!.prepare('INSERT INTO approval_history (id,incident_id,actor_id,action,note,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), id, access.id, decision === 'approved' ? 'Disetujui' : 'Ditolak / revisi', note, now),
    ]);
    await recordAudit(id, access.id, decision === 'approved' ? 'Respons disetujui' : 'Respons ditolak untuk revisi', note);
    return NextResponse.json({ ok: true });
  } catch (error) { console.error('Approval decision failed', error); return NextResponse.json({ error: 'Keputusan belum tersimpan.' }, { status: 503 }); }
}
