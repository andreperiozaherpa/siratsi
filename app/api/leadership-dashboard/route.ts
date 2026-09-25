import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../access';
import { createOverdueEscalations } from '@/app/escalation';

type IncidentRow = { id: string; category: string; location: string; stage: number; priority: string; data: string; updated_at: string };
export async function GET() {
  try {
    const access = await requireAccess();
    if (!access || !['leader_approver', 'super_admin'].includes(access.role)) return NextResponse.json({ error: 'Dashboard ini hanya tersedia untuk pimpinan.' }, { status: 403 });
    await createOverdueEscalations();
    const { results: incidents } = await env.DB!.prepare('SELECT id,category,location,stage,priority,data,updated_at FROM incidents WHERE stage BETWEEN 4 AND 6 ORDER BY updated_at DESC LIMIT 200').all<IncidentRow>();
    const now = Date.now();
    const parsed = incidents.map((incident) => { let data: Record<string, unknown> = {}; try { data = JSON.parse(incident.data || '{}'); } catch { /* Ignore invalid legacy data. */ } return { ...incident, data }; });
    const overdue = parsed.filter((incident) => incident.stage === 5 && incident.data.progress !== 'Selesai' && typeof incident.data.followUpDue === 'string' && Number.isFinite(new Date(incident.data.followUpDue).getTime()) && new Date(incident.data.followUpDue).getTime() < now)
      .map((incident) => ({ id: incident.id, category: incident.category, location: incident.location, priority: incident.priority, pic: String(incident.data.followUpOwner || 'Belum ditetapkan'), due: String(incident.data.followUpDue), progress: String(incident.data.progress || 'Belum mulai') }));
    const findings = parsed.filter((incident) => typeof incident.data.followUpNotes === 'string' && String(incident.data.followUpNotes).trim())
      .map((incident) => ({ id: incident.id, category: incident.category, location: incident.location, priority: incident.priority, note: String(incident.data.followUpNotes), progress: String(incident.data.progress || 'Pelaksanaan') }));
    const recipientScope = access.role === 'super_admin' ? '' : ' AND EXISTS (SELECT 1 FROM incident_escalation_recipients er WHERE er.escalation_id=e.id AND er.user_id=?)';
    const escalationQuery = `SELECT e.id,e.incident_id AS incidentId,e.reason,e.automatic,e.created_at AS createdAt,i.category,i.location,i.priority FROM incident_escalations e JOIN incidents i ON i.id=e.incident_id WHERE e.status='active'${recipientScope} ORDER BY e.created_at DESC LIMIT 100`;
    const handoffQuery = `SELECT h.id,h.incident_id AS incidentId,h.assigned_to AS assignedTo,h.reason,h.created_at AS createdAt,i.category,i.location,i.priority FROM incident_handoffs h JOIN incidents i ON i.id=h.incident_id WHERE h.status='active' ORDER BY h.created_at DESC LIMIT 100`;
    const escalationStatement = env.DB!.prepare(escalationQuery);
    const { results: escalations } = access.role === 'super_admin' ? await escalationStatement.all() : await escalationStatement.bind(access.id).all();
    const { results: handoffs } = await env.DB!.prepare(handoffQuery).all();
    return NextResponse.json({ overdue, findings, escalations, handoffs, generatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { console.error('Leadership dashboard failed', error); return NextResponse.json({ error: 'Dashboard pimpinan belum dapat dimuat.' }, { status: 503 }); }
}
