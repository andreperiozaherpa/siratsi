import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { assignedStakeholderNames, canManageCase, requireAccess } from '../../access';
import { recordAudit } from '@/app/audit';

export async function GET() {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Masuk dengan akun yang terdaftar.' }, { status: 401 });
    const query = access.role === 'external_stakeholder'
      ? env.DB!.prepare(`SELECT i.* FROM incidents i JOIN incident_stakeholders a ON a.incident_id = i.id
          WHERE a.organization = ? ORDER BY i.updated_at DESC LIMIT 200`).bind(access.organization)
      : env.DB!.prepare('SELECT * FROM incidents ORDER BY updated_at DESC LIMIT 200');
    const { results } = await query.all();
    const incidents = results.map((r) => ({ ...r, data: JSON.parse(String(r.data || '{}')) }));
    const assignedStakeholders = access.role === 'response_executor'
      ? new Set((await assignedStakeholderNames(access)).map((name) => name.toLocaleLowerCase()))
      : null;
    const visible = assignedStakeholders
      ? incidents.filter((incident) => Array.isArray(incident.data.stakeholderRoles) || typeof incident.data.stakeholderRoles === 'string').filter((incident) => {
        try {
          const rows = typeof incident.data.stakeholderRoles === 'string' ? JSON.parse(incident.data.stakeholderRoles) : incident.data.stakeholderRoles;
          return Array.isArray(rows) && rows.some((row) => row?.kind === 'internal' && assignedStakeholders.has(String(row.name || '').trim().toLocaleLowerCase()));
        } catch { return false; }
      }) : incidents;
    return NextResponse.json(visible);
  } catch (error) {
    console.error('Load incidents failed', error);
    return NextResponse.json({ error: 'Data belum dapat dimuat. Coba lagi.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    if (!canManageCase(access)) return NextResponse.json({ error: 'Hanya penerima informasi internal atau Super Admin yang dapat membuat informasi.' }, { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const keys = ['reporter', 'contact', 'description', 'location', 'category'];
    if (!keys.every((key) => typeof body[key] === 'string' && String(body[key]).trim())) {
      return NextResponse.json({ error: 'Lengkapi seluruh kolom wajib.' }, { status: 400 });
    }
    const id = `INF-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    await env.DB!.prepare('INSERT INTO incidents (id,created_at,updated_at,stage,reporter,contact,description,location,category,priority,data) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .bind(id, now, now, 0, String(body.reporter).trim().slice(0, 150), String(body.contact).trim().slice(0, 100), String(body.description).trim().slice(0, 4000), String(body.location).trim().slice(0, 250), String(body.category).trim().slice(0, 100), 'Sedang', '{}').run();
    await recordAudit(id, access.id, 'Informasi diterima', 'Kasus baru dicatat untuk verifikasi.');
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Create incident failed', error);
    return NextResponse.json({ error: 'Informasi belum tersimpan. Coba lagi.' }, { status: 503 });
  }
}
