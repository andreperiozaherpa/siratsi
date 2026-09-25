import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../access';

export async function GET() {
  const access = await requireAccess();
  if (!access || access.role === 'external_stakeholder') return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  const { results } = await env.DB!.prepare("SELECT id,name,role FROM users WHERE active = 1 AND role IN ('leader_approver','super_admin') ORDER BY role DESC,name").all();
  return NextResponse.json(results, { headers: { 'Cache-Control': 'private, no-store' } });
}
