import { env } from '@/app/database';

/** Records a concise, immutable operational event for a case. */
export async function recordAudit(incidentId: string, actorId: string, action: string, detail = '') {
  await env.DB!.prepare(
    'INSERT INTO audit_logs (id,incident_id,actor_id,action,detail,created_at) VALUES (?,?,?,?,?,?)',
  ).bind(crypto.randomUUID(), incidentId, actorId, action.slice(0, 120), detail.slice(0, 2000), new Date().toISOString()).run();
}
