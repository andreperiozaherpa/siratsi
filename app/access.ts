import { env } from '@/app/database';
import { passwordSessionUserId } from './password-auth';
export { externalOrganizations } from './roles';

export type Access = { id: string; email: string; name: string; role: 'super_admin' | 'internal_receiver' | 'leader_approver' | 'response_executor' | 'external_stakeholder'; organization: string; jobTitle: string; hasProfilePhoto: boolean };
export const canManageCase = (access: Access) => ['super_admin', 'internal_receiver'].includes(access.role);
export const canWorkStage = (access: Access, stage: number) => {
  if (access.role === 'super_admin') return stage >= 0 && stage <= 6;
  if (access.role === 'internal_receiver') return [0, 1, 2, 3, 5, 6].includes(stage);
  return access.role === 'response_executor' && stage === 4;
};
export async function currentAccess(): Promise<{ signedIn: boolean; access: Access | null }> {
  if (!env.DB) throw new Error('Database tidak tersedia');
  const sessionUserId = await passwordSessionUserId();
  if (sessionUserId) {
    const sessionUser = await env.DB.prepare('SELECT id,email,name,role,organization,job_title AS jobTitle,profile_photo_key AS profilePhotoKey,active FROM users WHERE id = ?').bind(sessionUserId).first<Access & { profilePhotoKey?: string | null; active: number }>();
    if (sessionUser?.active && ['super_admin', 'internal_receiver', 'leader_approver', 'response_executor', 'external_stakeholder'].includes(sessionUser.role)) return { signedIn: true, access: { id: sessionUser.id, email: sessionUser.email, name: sessionUser.name, role: sessionUser.role, organization: sessionUser.organization, jobTitle: sessionUser.jobTitle || '', hasProfilePhoto: Boolean(sessionUser.profilePhotoKey) } };
  }
  return { signedIn: false, access: null };
}

export async function requireAccess(): Promise<Access | null> {
  const { access } = await currentAccess();
  return access;
}

export async function assignedStakeholderNames(access: Access): Promise<string[]> {
  const { results } = await env.DB!.prepare(`SELECT d.name FROM user_stakeholders us
    JOIN stakeholder_directory d ON d.id = us.stakeholder_id
    WHERE us.user_id = ? AND d.active = 1`).bind(access.id).all<{ name: string }>();
  return results.map((entry) => entry.name);
}

export async function canReadIncident(access: Access, id: string): Promise<boolean> {
  if (access.role === 'response_executor') {
    const incident = await env.DB!.prepare('SELECT data FROM incidents WHERE id = ?').bind(id).first<{ data: string }>();
    try {
      const rawRows = JSON.parse(incident?.data || '{}').stakeholderRoles;
      const rows = typeof rawRows === 'string' ? JSON.parse(rawRows) : rawRows;
      const assigned = new Set((await assignedStakeholderNames(access)).map((name) => name.toLocaleLowerCase()));
      return Array.isArray(rows) && rows.some((row) => row?.kind === 'internal' && assigned.has(String(row.name || '').trim().toLocaleLowerCase()));
    } catch { return false; }
  }
  if (access.role !== 'external_stakeholder') return true;
  const row = await env.DB!.prepare('SELECT 1 FROM incident_stakeholders WHERE incident_id = ? AND organization = ? LIMIT 1').bind(id, access.organization).first();
  return !!row;
}
