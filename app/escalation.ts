import { env } from '@/app/database';

/** Escalations are delivered to every active leader and Super Admin. */
export async function createEscalation(incidentId: string, raisedBy: string, reason: string, automatic = false) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { results: leaders } = await env.DB!.prepare("SELECT id FROM users WHERE active=1 AND role IN ('leader_approver','super_admin')").all<{ id: string }>();
  await env.DB!.batch([
    env.DB!.prepare('INSERT INTO incident_escalations (id,incident_id,raised_by,reason,status,created_at,automatic,resolved_at,resolved_by,resolution_note) VALUES (?,?,?,?,?,?,?,NULL,NULL,\'\')')
      .bind(id, incidentId, raisedBy, reason.slice(0, 2000), 'active', now, automatic ? 1 : 0),
    ...leaders.map((leader) => env.DB!.prepare('INSERT IGNORE INTO incident_escalation_recipients (escalation_id,user_id,read_at) VALUES (?,?,NULL)').bind(id, leader.id)),
  ]);
  return id;
}

/** Creates one escalation for each overdue monitoring record, on the first request after its deadline. */
export async function createOverdueEscalations() {
  const { results } = await env.DB!.prepare('SELECT id,data FROM incidents WHERE stage=5 LIMIT 200').all<{ id: string; data: string }>();
  for (const incident of results) {
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(incident.data || '{}'); } catch { continue; }
    const due = String(data.followUpDue || '');
    if (!due || !Number.isFinite(new Date(due).getTime()) || new Date(due).getTime() >= Date.now() || data.progress === 'Selesai') continue;
    const existing = await env.DB!.prepare("SELECT 1 FROM incident_escalations WHERE incident_id=? AND status='active' AND automatic=1 LIMIT 1").bind(incident.id).first();
    if (existing) continue;
    const owner = await env.DB!.prepare('SELECT id FROM users WHERE active=1 AND role IN (\'super_admin\',\'internal_receiver\') ORDER BY role=\'super_admin\' DESC LIMIT 1').first<{ id: string }>();
    if (owner) await createEscalation(incident.id, owner.id, `Tenggat tindak lanjut ${due} telah terlewati. PIC: ${String(data.followUpOwner || 'belum ditetapkan')}.`, true);
  }
}
