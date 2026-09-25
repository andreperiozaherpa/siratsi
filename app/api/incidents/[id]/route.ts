import { NextResponse } from 'next/server';
import { env } from '@/app/database';
import { canReadIncident, canWorkStage, requireAccess } from '../../../access';
import { externalOrganizations } from '../../../roles';
import { readStakeholderRows, stakeholderRoles } from '../../../stakeholder-data';
import { recordAudit } from '@/app/audit';
import { createEscalation } from '@/app/escalation';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (!access) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const row = await env.DB!.prepare('SELECT stage, data FROM incidents WHERE id = ?').bind(id).first<{ stage: number; data: string }>();
    if (!row) return NextResponse.json({ error: 'Informasi tidak ditemukan.' }, { status: 404 });
    const stage = Number(body.stage);
    if (!Number.isInteger(stage) || stage < row.stage || stage > 7 || stage > row.stage + 1) return NextResponse.json({ error: 'Tahapan tidak valid.' }, { status: 400 });
    if (!canWorkStage(access, row.stage)) return NextResponse.json({ error: `Akun Anda tidak berwenang mengisi tahap ${row.stage + 1}. ${['Verifikasi', 'Lokasi prioritas', 'Bagi peran', 'Respons & persetujuan', 'Pelaksanaan', 'Monitor tindak lanjut', 'Evaluasi & SOP'][row.stage]}.` }, { status: 403 });
    if (access.role === 'response_executor' && !(await canReadIncident(access, id))) return NextResponse.json({ error: 'Tahap Pelaksanaan hanya dapat diisi oleh Pelaksana Respons yang ditugaskan pada kasus ini.' }, { status: 403 });
    if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    if (row.stage === 3) {
      if (stage === 4) return NextResponse.json({ error: 'Ajukan rencana dan tunggu persetujuan pimpinan sebelum pelaksanaan.' }, { status: 409 });
      const approval = await env.DB!.prepare('SELECT status FROM incident_approvals WHERE incident_id = ?').bind(id).first<{ status: string }>();
      if (approval?.status === 'pending') return NextResponse.json({ error: 'Pengajuan sedang menunggu persetujuan. Rencana tidak dapat diubah.' }, { status: 409 });
    }
    if (stage === 7 && row.stage === 6) {
      const evidence = await env.DB!.prepare('SELECT 1 FROM evidence_photos WHERE incident_id = ? LIMIT 1').bind(id).first();
      if (!evidence) return NextResponse.json({ error: 'Unggah minimal satu foto bukti dukung sebelum menyelesaikan kasus.' }, { status: 400 });
    }
    const prior = JSON.parse(row.data || '{}');
    const data = { ...prior, ...(body.data as object) } as Record<string, unknown>;
    const requiredText = (keys: string[]) => keys.every((key) => typeof data[key] === 'string' && String(data[key]).trim());
    if (row.stage === 5) {
      const assignedPics = new Set(readStakeholderRows(data.stakeholderRoles).map((entry) => entry.pic.trim()).filter(Boolean));
      const selectedPic = String(data.followUpOwner || '').trim();
      if (selectedPic && !assignedPics.has(selectedPic)) return NextResponse.json({ error: 'Pilih PIC tindak lanjut yang sudah ditetapkan pada tahap Bagi Peran.' }, { status: 400 });
    }
    if (stage > row.stage && row.stage === 0 && (!requiredText(['reportSource', 'verifiedReporterName', 'verifiedReporterContact', 'occurrenceLocation', 'occurrenceTime', 'verifiedBy', 'verificationMethod', 'confirmationNotes', 'verificationResult']) || !['Masyarakat', 'Mitra Bahari', 'Kring Bahari', 'Anggota Polairud', 'Instansi lain'].includes(String(data.reportSource)) || !['Hubungi pelapor', 'Cocokkan laporan atau dokumen', 'Cek data patroli / titik rawan', 'Koordinasi stakeholder', 'Pemeriksaan awal lapangan'].includes(String(data.verificationMethod)))) {
      return NextResponse.json({ error: 'Lengkapi identitas sumber, lokasi dan waktu, dugaan kejadian, bukti, serta hasil konfirmasi verifikasi.' }, { status: 400 });
    }
    if (stage > row.stage && row.stage === 1 && (!requiredText(['priorityArea', 'coordinates', 'riskLevel', 'priorityReason']) || !['Rendah', 'Sedang', 'Tinggi', 'Kritis'].includes(String(data.riskLevel)))) {
      return NextResponse.json({ error: 'Lengkapi area, koordinat, tingkat risiko, dan alasan penetapan prioritas.' }, { status: 400 });
    }
    if (stage > row.stage && row.stage === 4 && !requiredText(['executionDate', 'executionTeam', 'executionNotes'])) {
      return NextResponse.json({ error: 'Lengkapi tanggal, tim pelaksana, dan uraian pelaksanaan respons.' }, { status: 400 });
    }
    if (stage > row.stage && row.stage === 5 && (!requiredText(['progress', 'followUpOwner', 'followUpDue', 'escalation', 'followUpNotes']) || !['Belum mulai', 'Dalam proses', 'Butuh bantuan', 'Selesai'].includes(String(data.progress)) || !['Tidak diperlukan', 'Koordinasi dengan stakeholder', 'Eskalasi ke pimpinan', 'Pelimpahan tugas ke stakeholder'].includes(String(data.escalation)))) {
      return NextResponse.json({ error: 'Lengkapi status, PIC, target, tindakan berikutnya, dan keputusan penanganan hambatan.' }, { status: 400 });
    }
    if (row.stage === 0) {
      const result = String(data.verificationResult || '');
      if (stage === 1 && result === 'Valid / dapat ditindaklanjuti') {
        data.verificationStatus = 'Valid';
        data.caseStatus = 'Aktif';
      } else if (stage === 0 && result === 'Perlu pendalaman') {
        data.verificationStatus = 'Perlu dilengkapi';
        data.caseStatus = 'Menunggu kelengkapan';
      } else if (stage === 0 && result === 'Tidak valid') {
        data.verificationStatus = 'Ditolak';
        data.caseStatus = 'Ditolak';
        data.rejectedAt = new Date().toISOString();
      }
    }
    if (row.stage === 0 && stage === 1 && data.verificationResult !== 'Valid / dapat ditindaklanjuti') {
      return NextResponse.json({ error: 'Hanya informasi yang berstatus Valid yang dapat masuk ke penetapan lokasi prioritas. Gunakan Lengkapi atau Tolak untuk hasil lainnya.' }, { status: 409 });
    }
    if (row.stage === 5 && stage === 6 && data.progress !== 'Selesai') {
      return NextResponse.json({ error: 'Monitoring belum selesai. Perbarui progres menjadi Selesai sebelum masuk evaluasi, atau lakukan eskalasi.' }, { status: 409 });
    }
    if (row.stage === 5 && data.escalation === 'Pelimpahan tugas ke stakeholder' && (!String(data.handoffTo || '').trim() || !externalOrganizations.includes(String(data.handoffTo) as typeof externalOrganizations[number]) || !String(data.handoffReason || '').trim())) {
      return NextResponse.json({ error: 'Pilih stakeholder tujuan dan jelaskan tugas yang dilimpahkan.' }, { status: 400 });
    }
    if (row.stage === 6 && stage === 7) {
      const mapAction = String(data.mapAction || '');
      const sopAction = String(data.sopAction || '');
      const loss = Number(data.lossAmount || 0);
      if (!String(data.evaluation || '').trim() || !['Tidak ada perubahan peta', 'Tambahkan titik prioritas', 'Perbarui tingkat risiko', 'Tandai lokasi untuk pemantauan'].includes(mapAction) || !['Tidak ada pembaruan SOP', 'Perbarui SOP yang ada', 'Usulkan SOP atau ketentuan baru'].includes(sopAction)) return NextResponse.json({ error: 'Isi kesimpulan evaluasi serta keputusan pembaruan peta dan SOP sebelum menyelesaikan kasus.' }, { status: 400 });
      if (!Number.isFinite(loss) || loss < 0 || (loss > 0 && !String(data.lossBasis || '').trim())) return NextResponse.json({ error: 'Nilai dan dasar perhitungan kerugian belum valid.' }, { status: 400 });
      if (mapAction !== 'Tidak ada perubahan peta' && !String(data.mapUpdateDetails || '').trim()) return NextResponse.json({ error: 'Jelaskan rincian pembaruan peta yang dipilih.' }, { status: 400 });
      if (sopAction !== 'Tidak ada pembaruan SOP' && !String(data.sopUpdateDetails || '').trim()) return NextResponse.json({ error: 'Jelaskan rincian pembaruan SOP yang dipilih.' }, { status: 400 });
      data.caseStatus = 'Selesai';
      data.completedAt = new Date().toISOString();
    }
    const priority = ['Rendah', 'Sedang', 'Tinggi', 'Kritis'].includes(String(body.priority)) ? String(body.priority) : 'Sedang';
    if (row.stage === 1 && stage === 2) {
      const match = String(data.coordinates || '').match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (!match || Math.abs(Number(match[1])) > 90 || Math.abs(Number(match[2])) > 180) return NextResponse.json({ error: 'Pilih titik peta atau isi koordinat lintang, bujur yang valid.' }, { status: 400 });
    }
    let assignedOrganizations: string[] | null = null;
    if (row.stage === 2 && stage === 3) {
      const rows = readStakeholderRows(data.stakeholderRoles);
      const { results: directory } = await env.DB!.prepare("SELECT name,kind FROM stakeholder_directory WHERE active=1").all<{ name: string; kind: 'internal' | 'external' }>();
      const internalNames = new Set(directory.filter((entry) => entry.kind === 'internal').map((entry) => entry.name));
      const externalNames = new Set(directory.filter((entry) => entry.kind === 'external').map((entry) => entry.name));
      const unique = new Set(rows.map((entry) => `${entry.kind}:${entry.name}`));
      if (!rows.length || unique.size !== rows.length || !rows.some((entry) => entry.kind === 'internal' && entry.role === 'Koordinator') || rows.length > 15 || rows.some((entry) =>
        !(entry.kind === 'internal' ? internalNames.has(entry.name) : externalNames.has(entry.name)) ||
        !stakeholderRoles.includes(entry.role as typeof stakeholderRoles[number]) || !entry.task.trim() || entry.task.length > 500 ||
        !entry.pic.trim() || entry.pic.length > 150 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(entry.due) || !Number.isFinite(new Date(entry.due).getTime())
      )) return NextResponse.json({ error: 'Pilih koordinator internal dan lengkapi peran, tugas, PIC, serta batas waktu setiap stakeholder.' }, { status: 400 });
      assignedOrganizations = rows.filter((entry) => entry.kind === 'external').map((entry) => entry.name);
      data.leadUnit = rows.find((entry) => entry.kind === 'internal' && entry.role === 'Koordinator')?.name || '';
      data.externalStakeholders = assignedOrganizations.join(', ');
      data.roleDivision = rows.map((entry) => `${entry.name}: ${entry.role} - ${entry.task}`).join('\n');
    }
    const shouldEscalate = row.stage === 5 && data.escalation === 'Eskalasi ke pimpinan' && data.escalationRaisedFor !== `${data.escalation}:${data.followUpDue || ''}:${data.followUpNotes || ''}`;
    if (shouldEscalate) data.escalationRaisedFor = `${data.escalation}:${data.followUpDue || ''}:${data.followUpNotes || ''}`;
    const shouldHandoff = row.stage === 5 && data.escalation === 'Pelimpahan tugas ke stakeholder' && data.handoffRaisedFor !== `${data.handoffTo}:${data.handoffReason}`;
    if (shouldHandoff) data.handoffRaisedFor = `${data.handoffTo}:${data.handoffReason}`;
    const encoded = JSON.stringify(data);
    if (encoded.length > 30000) return NextResponse.json({ error: 'Data terlalu panjang.' }, { status: 400 });
    const update = env.DB!.prepare('UPDATE incidents SET stage = ?, data = ?, priority = ?, updated_at = ? WHERE id = ?')
      .bind(stage, encoded, priority, new Date().toISOString(), id);
    if (assignedOrganizations !== null) {
      await env.DB!.batch([update, env.DB!.prepare('DELETE FROM incident_stakeholders WHERE incident_id = ?').bind(id),
        ...assignedOrganizations.map((org) => env.DB!.prepare('INSERT INTO incident_stakeholders (incident_id,organization) VALUES (?,?)').bind(id, org))]);
    } else await update.run();
    if (shouldEscalate) {
      await createEscalation(id, access.id, `${data.escalation}: ${String(data.followUpNotes || '').trim() || 'Tidak ada catatan tambahan.'}`);
    }
    if (shouldHandoff) {
      const now = new Date().toISOString();
      await env.DB!.batch([
        env.DB!.prepare('INSERT INTO incident_handoffs (id,incident_id,assigned_to,raised_by,reason,status,created_at,resolved_at) VALUES (?,?,?,?,?,?,?,NULL)')
          .bind(crypto.randomUUID(), id, String(data.handoffTo), access.id, String(data.handoffReason).trim(), 'active', now),
        env.DB!.prepare('INSERT IGNORE INTO incident_stakeholders (incident_id,organization) VALUES (?,?)').bind(id, String(data.handoffTo)),
      ]);
    }
    const action = row.stage === 0 && stage === 0
      ? `Verifikasi: ${String(data.verificationStatus || data.verificationResult || 'draf')}`
      : shouldHandoff ? `Pelimpahan ke ${String(data.handoffTo)}` : shouldEscalate ? 'Eskalasi tindak lanjut' : stage > row.stage ? `Tahap dilanjutkan ke ${stage}` : 'Draf diperbarui';
    await recordAudit(id, access.id, action, row.stage === 0 && stage === 0 ? String(data.confirmationNotes || '') : '');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Update incident failed', error);
    return NextResponse.json({ error: 'Perubahan belum tersimpan. Coba lagi.' }, { status: 503 });
  }
}
