import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { requireAccess } from '../../access';

export async function GET() {
  const access = await requireAccess();
  if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const { results } = await env.DB!.prepare('SELECT incident_id AS incidentId, first_recorded_at AS firstRecordedAt, updated_at AS updatedAt, current_stage AS currentStage, reporter, contact, description, location, category, priority, case_status AS caseStatus, verification_status AS verificationStatus, source FROM historical_incidents ORDER BY first_recorded_at DESC LIMIT 500').all();
  return NextResponse.json(results, { headers: { 'Cache-Control': 'private, no-store' } });
}
