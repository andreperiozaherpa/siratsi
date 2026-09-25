import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canManageCase, externalOrganizations, requireAccess } from '../../../../access';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess(); if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const { id } = await params;
    const query = access.role === 'external_stakeholder'
      ? env.DB!.prepare('SELECT organization FROM incident_stakeholders WHERE incident_id = ? AND organization = ?').bind(id, access.organization)
      : env.DB!.prepare('SELECT organization FROM incident_stakeholders WHERE incident_id = ?').bind(id);
    const { results } = await query.all<{ organization: string }>();
    return NextResponse.json(results.map((r) => r.organization));
  } catch (error) { console.error('Load assignments failed', error); return NextResponse.json({ error: 'Penugasan belum dapat dimuat.' }, { status: 503 }); }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess(); if (!access || !canManageCase(access)) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    const { id } = await params;
    const body = await request.json() as { organizations?: unknown };
    if (!Array.isArray(body.organizations) || !body.organizations.every((v) => typeof v === 'string' && externalOrganizations.includes(v as typeof externalOrganizations[number]))) return NextResponse.json({ error: 'Pilihan instansi tidak valid.' }, { status: 400 });
    const unique = [...new Set(body.organizations as string[])];
    const row = await env.DB!.prepare('SELECT id FROM incidents WHERE id = ?').bind(id).first(); if (!row) return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
    await env.DB!.batch([env.DB!.prepare('DELETE FROM incident_stakeholders WHERE incident_id = ?').bind(id), ...unique.map((org) => env.DB!.prepare('INSERT INTO incident_stakeholders (incident_id,organization) VALUES (?,?)').bind(id, org))]);
    return NextResponse.json({ organizations: unique });
  } catch (error) { console.error('Update assignments failed', error); return NextResponse.json({ error: 'Penugasan belum tersimpan.' }, { status: 503 }); }
}
