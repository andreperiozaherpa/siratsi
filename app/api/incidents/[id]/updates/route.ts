import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canReadIncident, requireAccess } from '../../../../access';
import { recordAudit } from '@/app/audit';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess(); if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const { id } = await params; if (!(await canReadIncident(access, id))) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    const { results } = await env.DB!.prepare('SELECT organization,note,created_at FROM stakeholder_updates WHERE incident_id = ? ORDER BY created_at DESC LIMIT 100').bind(id).all();
    return NextResponse.json(results);
  } catch (error) { console.error('Load updates failed', error); return NextResponse.json({ error: 'Catatan belum dapat dimuat.' }, { status: 503 }); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess(); if (access?.role !== 'external_stakeholder') return NextResponse.json({ error: 'Hanya stakeholder eksternal yang dapat mengirim catatan.' }, { status: 403 });
    const { id } = await params; if (!(await canReadIncident(access, id))) return NextResponse.json({ error: 'Kasus tidak ditugaskan kepada instansi Anda.' }, { status: 403 });
    const body = await request.json() as { note?: unknown }; const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (!note || note.length > 1000) return NextResponse.json({ error: 'Catatan harus berisi 1–1000 karakter.' }, { status: 400 });
    await env.DB!.prepare('INSERT INTO stakeholder_updates (id,incident_id,user_id,organization,note,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), id, access.id, access.organization, note, new Date().toISOString()).run();
    await recordAudit(id, access.id, 'Pembaruan stakeholder', note);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { console.error('Create update failed', error); return NextResponse.json({ error: 'Catatan belum terkirim.' }, { status: 503 }); }
}
