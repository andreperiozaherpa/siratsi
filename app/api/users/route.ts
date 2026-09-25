import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { externalOrganizations, requireAccess } from '../../access';
import { hashPassword, validPassword } from '../../password-auth';

export async function GET() {
  try {
    const access = await requireAccess();
    if (access?.role !== 'super_admin') return NextResponse.json({ error: 'Hanya Super Admin yang dapat melihat pengguna.' }, { status: 403 });
    const { results } = await env.DB!.prepare('SELECT id,email,name,role,organization,active,created_at, EXISTS(SELECT 1 FROM password_credentials c WHERE c.user_id = users.id) AS has_password FROM users ORDER BY created_at DESC').all();
    return NextResponse.json(results);
  } catch (error) { console.error('List users failed', error); return NextResponse.json({ error: 'Daftar pengguna belum dapat dimuat.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess();
    if (access?.role !== 'super_admin') return NextResponse.json({ error: 'Hanya Super Admin yang dapat menambahkan pengguna.' }, { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const role = String(body.role || '');
    const organization = ['internal_receiver', 'leader_approver', 'response_executor'].includes(role) ? 'Ditpolairud Polda Lampung' : String(body.organization || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name || name.length > 150 || !['internal_receiver', 'leader_approver', 'response_executor', 'external_stakeholder'].includes(role) || (role === 'external_stakeholder' && !externalOrganizations.includes(organization as typeof externalOrganizations[number]))) {
      return NextResponse.json({ error: 'Nama, email, peran, atau instansi tidak valid.' }, { status: 400 });
    }
    const password = body.password;
    if (typeof password !== 'string' || !validPassword(password)) return NextResponse.json({ error: 'Kata sandi harus terdiri dari 12–128 karakter.' }, { status: 400 });
    const hash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB!.batch([
      env.DB!.prepare('INSERT INTO users (id,email,name,role,organization,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(userId, email, name, role, organization, 1, now, now),
      env.DB!.prepare('INSERT INTO password_credentials (user_id,password_hash,failed_attempts,updated_at) VALUES (?,?,0,?)').bind(userId, hash, now),
    ]);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Create user failed', error);
    return NextResponse.json({ error: 'Akun belum tersimpan. Email mungkin sudah terdaftar.' }, { status: 409 });
  }
}
