import { env } from '@/app/database';
import { getChatGPTUser } from './chatgpt-auth';
import { passwordSessionUserId } from './password-auth';
export { externalOrganizations } from './roles';

export type Access = { id: string; email: string; name: string; role: 'super_admin' | 'internal_receiver' | 'leader_approver' | 'response_executor' | 'external_stakeholder'; organization: string; jobTitle: string; hasProfilePhoto: boolean };
export const canManageCase = (access: Access) => ['super_admin', 'internal_receiver'].includes(access.role);
export const canWorkStage = (access: Access, stage: number) => {
  if (access.role === 'super_admin') return stage >= 0 && stage <= 6;
  if (access.role === 'internal_receiver') return [0, 1, 2, 3, 5, 6].includes(stage);
  return access.role === 'response_executor' && stage === 4;
};
const normalize = (email: string) => email.trim().toLowerCase();

export async function currentAccess(): Promise<{ signedIn: boolean; access: Access | null }> {
  if (!env.DB) throw new Error('Database tidak tersedia');
  const sessionUserId = await passwordSessionUserId();
  if (sessionUserId) {
    const sessionUser = await env.DB.prepare('SELECT id,email,name,role,organization,job_title AS jobTitle,profile_photo_key AS profilePhotoKey,active FROM users WHERE id = ?').bind(sessionUserId).first<Access & { profilePhotoKey?: string | null; active: number }>();
    if (sessionUser?.active && ['super_admin', 'internal_receiver', 'leader_approver', 'response_executor', 'external_stakeholder'].includes(sessionUser.role)) return { signedIn: true, access: { id: sessionUser.id, email: sessionUser.email, name: sessionUser.name, role: sessionUser.role, organization: sessionUser.organization, jobTitle: sessionUser.jobTitle || '', hasProfilePhoto: Boolean(sessionUser.profilePhotoKey) } };
  }
  const identity = await getChatGPTUser();
  if (!identity) return { signedIn: false, access: null };
  const email = normalize(identity.email);
  const adminEmail = normalize(env.SIRATSI_ADMIN_EMAIL || '');
  if (!env.DB) throw new Error('Database tidak tersedia');
  if (adminEmail && email === adminEmail) {
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT IGNORE INTO users (id,email,name,role,organization,auth_user_id,active,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(), email, identity.displayName, 'super_admin', 'Ditpolairud Polda Lampung', identity.userId, 1, now, now).run();
  }
  const row = await env.DB.prepare('SELECT id,email,name,role,organization,job_title AS jobTitle,profile_photo_key AS profilePhotoKey,auth_user_id,active FROM users WHERE email = ?').bind(email).first<Access & { profilePhotoKey?: string | null; auth_user_id: string | null; active: number }>();
  if (!row || !row.active) return { signedIn: true, access: null };
  if (row.auth_user_id && row.auth_user_id !== identity.userId) return { signedIn: true, access: null };
  if (!row.auth_user_id) {
    await env.DB.prepare('UPDATE users SET auth_user_id = ?, updated_at = ? WHERE id = ? AND auth_user_id IS NULL').bind(identity.userId, new Date().toISOString(), row.id).run();
  }
  if (!['super_admin', 'internal_receiver', 'leader_approver', 'response_executor', 'external_stakeholder'].includes(row.role)) return { signedIn: true, access: null };
  return { signedIn: true, access: { id: row.id, email: row.email, name: row.name, role: row.role, organization: row.organization, jobTitle: row.jobTitle || '', hasProfilePhoto: Boolean(row.profilePhotoKey) } };
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
