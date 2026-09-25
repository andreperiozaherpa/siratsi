import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../../../access';
import { hashPassword, validPassword } from '../../../../password-auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (access?.role !== 'super_admin') return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    const { id } = await params;
    const row = await env.DB!.prepare('SELECT role FROM users WHERE id = ?').bind(id).first<{ role: string }>();
    if (!row || (row.role === 'super_admin' && id !== access.id)) return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    const body = await request.json() as { password?: unknown };
    if (typeof body.password !== 'string' || !validPassword(body.password)) return NextResponse.json({ error: 'Kata sandi harus terdiri dari 12–128 karakter.' }, { status: 400 });
    const hash = await hashPassword(body.password);
    await env.DB!.prepare(`INSERT INTO password_credentials (user_id, password_hash, failed_attempts, locked_until, updated_at) VALUES (?, ?, 0, NULL, ?)
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), failed_attempts = 0, locked_until = NULL, updated_at = VALUES(updated_at)`)
      .bind(id, hash, new Date().toISOString()).run();
    await env.DB!.prepare('DELETE FROM password_sessions WHERE user_id = ?').bind(id).run();
    return NextResponse.json({ ok: true });
  } catch (error) { console.error('Password update failed', error); return NextResponse.json({ error: 'Kata sandi belum tersimpan.' }, { status: 503 }); }
}
