import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { assignedStakeholderNames, requireAccess } from '../../access';
import { createOverdueEscalations } from '@/app/escalation';

type IncidentNotification = { id: string; stage: number; updated_at: string; data: string };

export async function GET() {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    await createOverdueEscalations();

    const { results: incidents } = await env.DB!.prepare(`SELECT i.id,i.stage,i.updated_at,i.data
      FROM incidents i LEFT JOIN notification_reads r ON r.incident_id=i.id AND r.user_id=?
      WHERE r.last_seen_updated_at IS NULL OR r.last_seen_updated_at < i.updated_at
      ORDER BY i.updated_at DESC LIMIT 200`).bind(access.id).all<IncidentNotification>();

    let targets = new Set<string>();
    if (access.role === 'super_admin') {
      targets = new Set(incidents.map((incident) => incident.id));
    } else if (access.role === 'internal_receiver') {
      targets = new Set(incidents.filter((incident) => incident.stage <= 3).map((incident) => incident.id));
    } else if (access.role === 'external_stakeholder') {
      const { results } = await env.DB!.prepare(`SELECT i.id FROM incidents i JOIN incident_stakeholders a ON a.incident_id=i.id
        LEFT JOIN notification_reads r ON r.incident_id=i.id AND r.user_id=?
        WHERE a.organization=? AND json_extract(i.data, '$.notifyStakeholders') IS NOT 0
          AND (r.last_seen_updated_at IS NULL OR r.last_seen_updated_at < i.updated_at)`).bind(access.id, access.organization).all<{ id: string }>();
      targets = new Set(results.map((item) => item.id));
    } else if (access.role === 'response_executor') {
      const assigned = new Set((await assignedStakeholderNames(access)).map((name) => name.toLocaleLowerCase()));
      targets = new Set(incidents.filter((incident) => {
        try {
          const raw = JSON.parse(incident.data || '{}').stakeholderRoles;
          const rows = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return incident.stage === 4 && Array.isArray(rows) && rows.some((row) => row?.kind === 'internal' && assigned.has(String(row.name || '').trim().toLocaleLowerCase()));
        } catch { return false; }
      }).map((incident) => incident.id));
    } else if (access.role === 'leader_approver') {
      const [approvals, escalations] = await Promise.all([
        env.DB!.prepare("SELECT incident_id AS id FROM incident_approvals WHERE approver_id=? AND status='pending'").bind(access.id).all<{ id: string }>(),
        env.DB!.prepare(`SELECT e.incident_id AS id FROM incident_escalations e JOIN incident_escalation_recipients r ON r.escalation_id=e.id
          WHERE r.user_id=? AND r.read_at IS NULL AND e.status='active'`).bind(access.id).all<{ id: string }>(),
      ]);
      targets = new Set([...approvals.results, ...escalations.results].map((item) => item.id));
    }

    const unreadIncidentIds = new Set(incidents.map((incident) => incident.id));
    return NextResponse.json({ unreadIds: [...targets].filter((id) => unreadIncidentIds.has(id)) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Notification list failed', error);
    return NextResponse.json({ error: 'Notifikasi belum dapat dimuat.' }, { status: 503 });
  }
}
