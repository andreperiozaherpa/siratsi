import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canManageCase, requireAccess } from '../../../../access';
import { recordAudit } from '@/app/audit';

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  const access = await requireAccess();
  if (!access || access.role === 'external_stakeholder') return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  const { id } = await params;
  const record = await env.DB!.prepare(`SELECT a.*,u.name AS approver_name,r.name AS requester_name FROM incident_approvals a JOIN users u ON a.approver_id=u.id JOIN users r ON a.requested_by=r.id WHERE a.incident_id=?`).bind(id).first();
  if (access.role === 'leader_approver' && (!record || String(record.approver_id) !== access.id)) return NextResponse.json({ error: 'Pengajuan ini tidak ditujukan kepada Anda.' }, { status: 403 });
  const { results } = await env.DB!.prepare(`SELECT h.action,h.note,h.created_at AS createdAt,u.name AS actorName FROM approval_history h JOIN users u ON h.actor_id=u.id WHERE h.incident_id=? ORDER BY h.created_at DESC`).bind(id).all();
  return NextResponse.json({ record: record || null, history: results }, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(request: Request, { params }: Context) {
  try {
    const access = await requireAccess();
    if (!access || !canManageCase(access)) return NextResponse.json({ error: 'Hanya penerima informasi internal atau Super Admin yang dapat mengajukan respons.' }, { status: 403 });
    const { id } = await params;
    const body = await request.json() as { data?: Record<string, unknown> };
    const form = body.data || {};
    const required = ['responseType', 'urgency', 'responseGoal', 'responsePlan', 'targetDate', 'durationHours', 'resources', 'approverId'];
    if (required.some((key) => !String(form[key] ?? '').trim())) return NextResponse.json({ error: 'Lengkapi jenis respons, urgensi, tujuan, rencana, waktu, durasi, sarana, dan pimpinan.' }, { status: 400 });
    if (!['Patroli / Penindakan', 'Pengawasan / Monitoring', 'Koordinasi / Klarifikasi', 'Bantuan SAR', 'Lainnya'].includes(String(form.responseType)) || !['Sangat Mendesak', 'Mendesak', 'Normal', 'Rutin'].includes(String(form.urgency)) || Number(form.durationHours) <= 0 || Number(form.durationHours) > 720 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(form.targetDate)) || !Number.isFinite(new Date(String(form.targetDate)).getTime())) return NextResponse.json({ error: 'Jenis respons, urgensi, atau waktu tidak valid.' }, { status: 400 });
    if (String(form.responseGoal).length > 500 || String(form.responsePlan).length > 2000 || String(form.resources).length > 500 || String(form.requestNote || '').length > 500) return NextResponse.json({ error: 'Isi rencana terlalu panjang.' }, { status: 400 });
    const sopReferenceId = String(form.sopReferenceId || '').trim();
    const [incident, approver, priorApproval, sop] = await Promise.all([
      env.DB!.prepare('SELECT stage,data FROM incidents WHERE id=?').bind(id).first<{ stage: number; data: string }>(),
      env.DB!.prepare("SELECT id,name FROM users WHERE id=? AND active=1 AND role IN ('leader_approver','super_admin')").bind(String(form.approverId)).first<{ id: string; name: string }>(),
      env.DB!.prepare('SELECT status FROM incident_approvals WHERE incident_id=?').bind(id).first<{ status: string }>(),
      sopReferenceId ? env.DB!.prepare("SELECT id,title FROM sop_documents WHERE id=? AND status='active'").bind(sopReferenceId).first<{ id: string; title: string }>() : Promise.resolve(null),
    ]);
    if (!incident || incident.stage !== 3 || !approver || priorApproval?.status === 'pending' || priorApproval?.status === 'approved' || (sopReferenceId && !sop)) return NextResponse.json({ error: 'Pengajuan tidak tersedia, pimpinan tidak valid, atau SOP acuan tidak aktif.' }, { status: 409 });
    const allowed = ['responseType','urgency','responseGoal','responsePlan','targetDate','durationHours','resources','approverId','requestNote','notifyStakeholders','sopReferenceId','sopReferenceTitle'];
    const clean = Object.fromEntries(allowed.map((key) => [key, form[key]]));
    const data = { ...JSON.parse(incident.data || '{}'), ...clean, approver: approver.name, approvalStatus: 'Diajukan' };
    if (JSON.stringify(data).length > 30000) return NextResponse.json({ error: 'Data terlalu panjang.' }, { status: 400 });
    const now = new Date().toISOString();
    await env.DB!.batch([
      env.DB!.prepare('UPDATE incidents SET data=?,updated_at=? WHERE id=? AND stage=3').bind(JSON.stringify(data), now, id),
      env.DB!.prepare(`INSERT INTO incident_approvals (incident_id,approver_id,requested_by,status,submitted_at,decided_at,decision_note) VALUES (?,?,?,'pending',?,NULL,NULL) ON DUPLICATE KEY UPDATE approver_id=VALUES(approver_id),requested_by=VALUES(requested_by),status='pending',submitted_at=VALUES(submitted_at),decided_at=NULL,decision_note=NULL`).bind(id, approver.id, access.id, now),
      env.DB!.prepare('INSERT INTO approval_history (id,incident_id,actor_id,action,note,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), id, access.id, 'Diajukan', String(form.requestNote || '').trim(), now),
    ]);
    await recordAudit(id, access.id, 'Respons diajukan', String(form.requestNote || '').trim());
    return NextResponse.json({ ok: true });
  } catch (error) { console.error('Submit approval failed', error); return NextResponse.json({ error: 'Pengajuan belum tersimpan.' }, { status: 503 }); }
}
