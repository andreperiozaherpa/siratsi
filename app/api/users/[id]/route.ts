import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { externalOrganizations, requireAccess } from '../../../access';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (access?.role !== 'super_admin') return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const row = await env.DB!.prepare('SELECT email,name,role,organization,active FROM users WHERE id = ?').bind(id).first<{ email: string; name: string; role: string; organization: string; active: number }>();
    if (!row) return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    const name = body.name === undefined ? row.name : String(body.name).trim();
    const email = body.email === undefined ? row.email : String(body.email).trim().toLowerCase();
    const role = body.role === undefined ? row.role : String(body.role);
    const active = body.active === undefined ? Boolean(row.active) : body.active;
    const organization = ['internal_receiver', 'leader_approver', 'response_executor', 'super_admin'].includes(role) ? 'Ditpolairud Polda Lampung' : String(body.organization === undefined ? row.organization : body.organization);
    if (!name || name.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !['super_admin', 'internal_receiver', 'leader_approver', 'response_executor', 'external_stakeholder'].includes(role) || typeof active !== 'boolean' || (role === 'external_stakeholder' && !externalOrganizations.includes(organization as typeof externalOrganizations[number]))) return NextResponse.json({ error: 'Data pengguna tidak valid.' }, { status: 400 });
    if (id === access.id && (!active || role !== 'super_admin')) return NextResponse.json({ error: 'Super Admin tidak dapat menonaktifkan atau mengubah peran sendiri.' }, { status: 400 });
    if (row.role === 'super_admin' && id !== access.id && (role !== 'super_admin' || !active)) return NextResponse.json({ error: 'Status atau peran Super Admin lain tidak dapat diubah.' }, { status: 403 });
    await env.DB!.prepare('UPDATE users SET name=?,email=?,role=?,organization=?,active=?,updated_at=? WHERE id=?').bind(name, email, role, organization, active ? 1 : 0, new Date().toISOString(), id).run();
    return NextResponse.json({ ok: true });
  } catch (error) { console.error('Update user failed', error); return NextResponse.json({ error: 'Status belum tersimpan.' }, { status: 503 }); }
}
