import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { issueSession, verifyPassword } from '../../../password-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (email.length > 254 || password.length > 128 || !email || !password) return NextResponse.json({ error: 'Email atau kata sandi tidak sesuai.' }, { status: 401 });
    const row = await env.DB!.prepare(`SELECT u.id, u.active, c.password_hash AS passwordHash, c.failed_attempts AS failedAttempts, c.locked_until AS lockedUntil
      FROM users u JOIN password_credentials c ON c.user_id = u.id WHERE u.email = ?`).bind(email).first<{ id: string; active: number; passwordHash: string; failedAttempts: number; lockedUntil: string | null }>();
    if (!row || !row.active) return NextResponse.json({ error: 'Email atau kata sandi tidak sesuai.' }, { status: 401 });
    const now = new Date();
    if (row.lockedUntil && row.lockedUntil > now.toISOString()) return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }, { status: 429 });
    if (!(await verifyPassword(password, row.passwordHash))) {
      const attempts = (row.failedAttempts || 0) + 1;
      await env.DB!.prepare('UPDATE password_credentials SET failed_attempts = ?, locked_until = ? WHERE user_id = ?')
        .bind(attempts >= 5 ? 0 : attempts, attempts >= 5 ? new Date(now.getTime() + 15 * 60000).toISOString() : null, row.id).run();
      return NextResponse.json({ error: 'Email atau kata sandi tidak sesuai.' }, { status: 401 });
    }
    await env.DB!.prepare('UPDATE password_credentials SET failed_attempts = 0, locked_until = NULL WHERE user_id = ?').bind(row.id).run();
    await issueSession(row.id);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { console.error('Password sign-in failed', error); return NextResponse.json({ error: 'Layanan masuk belum tersedia. Coba lagi.' }, { status: 503 }); }
}
