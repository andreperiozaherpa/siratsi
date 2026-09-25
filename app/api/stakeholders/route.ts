import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../access';

export async function GET(request: Request) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const includeInactive = access.role === 'super_admin' && new URL(request.url).searchParams.get('includeInactive') === '1';
    const { results } = await env.DB!.prepare(`SELECT id,name,kind,detail,active FROM stakeholder_directory ${includeInactive ? '' : 'WHERE active = 1'} ORDER BY kind,name`).all();
    return NextResponse.json({ entries: results, canManage: access.role === 'super_admin' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Load stakeholder directory failed', error);
    return NextResponse.json({ error: 'Master stakeholder belum dapat dimuat.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess();
    if (access?.role !== 'super_admin') return NextResponse.json({ error: 'Hanya Super Admin yang dapat menambah stakeholder.' }, { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name || '').trim();
    const kind = String(body.kind || '');
    const detail = String(body.detail || '').trim();
    if (!name || name.length > 150 || detail.length > 500 || !['internal', 'external'].includes(kind)) {
      return NextResponse.json({ error: 'Nama, kelompok, atau keterangan stakeholder tidak valid.' }, { status: 400 });
    }
    const now = new Date().toISOString();
    await env.DB!.prepare('INSERT INTO stakeholder_directory (id,name,kind,detail,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)')
      .bind(crypto.randomUUID(), name, kind, detail, now, now).run();
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Create stakeholder failed', error);
    return NextResponse.json({ error: 'Stakeholder belum tersimpan. Nama mungkin sudah terdaftar.' }, { status: 409 });
  }
}
