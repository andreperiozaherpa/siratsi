import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../access';

export async function GET() {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const { results } = await env.DB!.prepare('SELECT id,title,category,version,reference_url AS referenceUrl,status,notes,created_at AS createdAt,updated_at AS updatedAt FROM sop_documents WHERE status=? ORDER BY category,title LIMIT 200').bind('active').all();
    return NextResponse.json(results, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { console.error('Load SOP failed', error); return NextResponse.json({ error: 'Repositori SOP belum dapat dimuat.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess();
    if (!access || access.role !== 'super_admin') return NextResponse.json({ error: 'Hanya Super Admin yang dapat menambah SOP atau regulasi.' }, { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const title = String(body.title || '').trim(); const category = String(body.category || '').trim(); const version = String(body.version || '').trim();
    const referenceUrl = String(body.referenceUrl || '').trim(); const notes = String(body.notes || '').trim();
    if (!title || !category || !version || title.length > 250 || category.length > 100 || version.length > 80 || referenceUrl.length > 1000 || notes.length > 2000) return NextResponse.json({ error: 'Lengkapi judul, kategori, dan versi dokumen dengan data yang valid.' }, { status: 400 });
    if (referenceUrl && !/^https?:\/\//i.test(referenceUrl)) return NextResponse.json({ error: 'Tautan referensi harus dimulai dengan http:// atau https://.' }, { status: 400 });
    const now = new Date().toISOString();
    await env.DB!.prepare('INSERT INTO sop_documents (id,title,category,version,reference_url,status,notes,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(), title, category, version, referenceUrl, 'active', notes, access.id, now, now).run();
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { console.error('Create SOP failed', error); return NextResponse.json({ error: 'Dokumen belum tersimpan.' }, { status: 503 }); }
}
