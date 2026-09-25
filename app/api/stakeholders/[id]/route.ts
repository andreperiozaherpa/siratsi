import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../../access';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (access?.role !== 'super_admin') return NextResponse.json({ error: 'Hanya Super Admin yang dapat mengubah stakeholder.' }, { status: 403 });
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.active !== 'boolean') return NextResponse.json({ error: 'Status stakeholder tidak valid.' }, { status: 400 });
    const result = await env.DB!.prepare('UPDATE stakeholder_directory SET active=?, updated_at=? WHERE id=?')
      .bind(body.active ? 1 : 0, new Date().toISOString(), id).run();
    if (!result.meta.changes) return NextResponse.json({ error: 'Stakeholder tidak ditemukan.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Update stakeholder failed', error);
    return NextResponse.json({ error: 'Status stakeholder belum diperbarui.' }, { status: 503 });
  }
}
