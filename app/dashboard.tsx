'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, Bell, CheckCircle2, ClipboardCheck, Download, FilePlus2, FileText, LayoutDashboard, MapPin, Printer, Search, ShieldCheck, Users, Waves, Menu, Compass, BarChart3, Ship, ChevronRight, Camera, ImagePlus, Anchor, Radar, Crosshair, Settings2, CalendarDays, TrendingUp, Coins, AlertTriangle, BookOpen, Clock3, UserRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { Access } from './access';
import { externalOrganizations } from './roles';
import { bases, riskPoints } from './reference-data';
import InteractiveMap, { formatCoordinates, googleMapsUrl, parseCoordinates, type MapMarker } from './interactive-map';
import { StakeholderForm, StakeholderSummary, type StakeholderDocument } from './stakeholder-form';
import { ExecutionEvidenceUploader } from './execution-evidence-uploader';
import { VerificationEvidenceUploader } from './verification-evidence-uploader';
import { readStakeholderRows } from './stakeholder-data';
import { ResponseApprovalForm, ApprovalSummary, type ApprovalState, type ApprovalDocument } from './response-approval-form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DashboardHeader, DashboardSidebar } from './dashboard-chrome';
import { UserEditButton } from './user-edit-button';

type Incident = { id: string; created_at: string; updated_at: string; stage: number; reporter: string; contact: string; description: string; location: string; category: string; priority: string; data: Record<string, string | boolean> };
type View = 'dashboard' | 'new' | 'cases' | 'detail' | 'reports' | 'flow' | 'map' | 'historical' | 'users' | 'profile' | 'stage' | 'notifications' | 'sop';
type ManagedUser = { id: string; email: string; name: string; role: string; organization: string; active: number; created_at: string; has_password?: number };
type EvidencePhoto = { id: string; filename: string; contentType: string; sizeBytes: number; createdAt: string };
type VerificationEvidence = EvidencePhoto;
type HistoricalIncident = { incidentId: string; firstRecordedAt: string; updatedAt: string; currentStage: number; reporter: string; contact: string; description: string; location: string; category: string; priority: string; caseStatus: string; verificationStatus: string; source: string };
type StakeholderUpdate = { organization: string; note: string; created_at: string };
type AuditEvent = { action: string; detail: string; created_at: string; actor: string };
type SopDocument = { id: string; title: string; category: string; version: string; referenceUrl: string; notes: string; updatedAt: string };
type Field = { key: string; label: string; kind?: 'text' | 'textarea' | 'date' | 'datetime' | 'number' | 'select' | 'checkbox' | 'upload' | 'execution-upload' | 'heading' | 'evaluation-context'; options?: string[]; required?: boolean; hint?: string };
const stages = ['Verifikasi', 'Lokasi prioritas', 'Bagi peran', 'Respons & persetujuan', 'Pelaksanaan', 'Monitor tindak lanjut', 'Evaluasi & SOP', 'Selesai'];
const viewPaths: Partial<Record<View, string>> = { dashboard: '/dashboard', new: '/input-informasi', cases: '/daftar-informasi', reports: '/laporan', flow: '/alur-kerja', map: '/peta-prioritas', historical: '/data-historis', users: '/pengaturan-pengguna', profile: '/edit-profil', notifications: '/notifikasi' };
const stagePaths = ['/verifikasi-informasi', '/lokasi-prioritas', '/bagi-peran', '/respons-persetujuan', '/pelaksanaan-respons', '/monitor-tindak-lanjut', '/evaluasi-sop', '/selesai'];
type UserRole = Access['role'];
const roleViews: Record<UserRole, View[]> = {
  super_admin: ['dashboard', 'new', 'cases', 'detail', 'reports', 'flow', 'map', 'historical', 'users', 'profile', 'stage', 'notifications', 'sop'],
  internal_receiver: ['dashboard', 'new', 'cases', 'detail', 'reports', 'flow', 'map', 'historical', 'profile', 'stage', 'notifications', 'sop'],
  leader_approver: ['dashboard', 'cases', 'detail', 'reports', 'flow', 'profile', 'stage', 'notifications'],
  response_executor: ['dashboard', 'cases', 'detail', 'reports', 'profile', 'stage', 'notifications'],
  external_stakeholder: ['dashboard', 'cases', 'detail', 'reports', 'profile', 'notifications'],
};
const roleStages: Record<UserRole, number[]> = {
  super_admin: [0, 1, 2, 3, 4, 5, 6, 7],
  internal_receiver: [0, 1, 2, 3, 5, 6],
  leader_approver: [3],
  response_executor: [4],
  external_stakeholder: [],
};
const canAccessPage = (access: Access, view: View, stage?: number) => roleViews[access.role].includes(view) && (view !== 'stage' || (stage !== undefined && roleStages[access.role].includes(stage)));
const viewFromPath = (path: string): { view: View; stage?: number } => {
  const stage = stagePaths.indexOf(path); if (stage >= 0) return { view: 'stage', stage };
  const entry = Object.entries(viewPaths).find(([, value]) => value === path);
  return entry ? { view: entry[0] as View } : { view: 'dashboard' };
};
const forms: Field[][] = [
  [
    { key: 'source-heading', label: 'Identitas dan sumber laporan', kind: 'heading', hint: 'Pastikan sumber informasi dan narahubung dapat dihubungi.' },
    { key: 'reportSource', label: 'Asal informasi', kind: 'select', options: ['Masyarakat', 'Mitra Bahari', 'Kring Bahari', 'Anggota Polairud', 'Instansi lain'], required: true },
    { key: 'verifiedReporterName', label: 'Nama pelapor / narahubung', required: true },
    { key: 'verifiedReporterContact', label: 'Nomor kontak pelapor', required: true },
    { key: 'incident-heading', label: 'Lokasi, waktu, dan rincian kejadian', kind: 'heading', hint: 'Jenis kejadian diambil dari informasi awal dan tidak perlu diisi ulang.' },
    { key: 'occurrenceLocation', label: 'Lokasi kejadian', hint: 'Isi lokasi yang cukup jelas untuk dicari pada peta.', required: true },
    { key: 'occurrenceTime', label: 'Waktu atau perkiraan waktu kejadian', kind: 'datetime', hint: 'Pilih tanggal dan isi jam kejadian atau perkiraannya.', required: true },
    { key: 'incidentCharacteristics', label: 'Ciri kapal, pelaku, arah, jumlah kapal, atau alat yang digunakan', kind: 'textarea', hint: 'Isi bila tersedia. Catat juga informasi yang belum diketahui.' },
    { key: 'evidence-heading', label: 'Bukti pendukung', kind: 'heading', hint: 'Bagian ini opsional dan dapat dilengkapi kemudian.' },
    { key: 'supportingEvidence', label: 'Keterangan bukti pendukung', kind: 'textarea', hint: 'Opsional. Jelaskan foto, video, dokumen, rekaman komunikasi, atau sumber lain bila ada.' },
    { key: 'verificationEvidenceUpload', label: 'Unggah bukti pendukung', kind: 'upload', hint: 'Opsional. PDF, foto, video MP4, atau audio; maksimal 15 MB per berkas.' },
    { key: 'confirmation-heading', label: 'Konfirmasi dan hasil verifikasi', kind: 'heading', hint: 'Catat petugas dan hasil pengecekan terhadap sumber atau data pendukung.' },
    { key: 'verifiedBy', label: 'Diverifikasi oleh', hint: 'Nama dan jabatan petugas yang melakukan verifikasi.', required: true },
    { key: 'verificationMethod', label: 'Metode konfirmasi utama', kind: 'select', options: ['Hubungi pelapor', 'Cocokkan laporan atau dokumen', 'Cek data patroli / titik rawan', 'Koordinasi stakeholder', 'Pemeriksaan awal lapangan'], required: true },
    { key: 'confirmationNotes', label: 'Hasil langkah konfirmasi', kind: 'textarea', hint: 'Catat siapa yang dihubungi, data yang dicocokkan, serta hasilnya.', required: true },
    { key: 'verificationResult', label: 'Hasil verifikasi', kind: 'select', options: ['Valid / dapat ditindaklanjuti', 'Perlu pendalaman', 'Tidak valid'], required: true },
  ],
  [
    { key: 'priorityArea', label: 'Area / titik prioritas', kind: 'select', options: [...riskPoints.map((p) => p.name), 'Lokasi lain'], required: true },
    { key: 'coordinates', label: 'Koordinat titik pilihan', hint: 'Klik peta atau isi lintang, bujur. Contoh: -5.450000, 105.270000', required: true },
    { key: 'riskLevel', label: 'Tingkat prioritas', kind: 'select', options: ['Rendah', 'Sedang', 'Tinggi', 'Kritis'], required: true },
    { key: 'priorityReason', label: 'Alasan penetapan prioritas', kind: 'textarea', required: true },
  ],
  [],
  [],
  [
    { key: 'executionDate', label: 'Tanggal pelaksanaan', kind: 'date', required: true },
    { key: 'executionTeam', label: 'Tim / instansi pelaksana', kind: 'select', required: true, hint: 'Pilih stakeholder yang telah ditetapkan pada tahap 3.' },
    { key: 'executionNotes', label: 'Uraian pelaksanaan dan hasil sementara', kind: 'textarea', required: true },
    { key: 'evidenceReference', label: 'Referensi bukti / dokumentasi', hint: 'Nomor dokumen atau tautan yang dapat diakses petugas' },
    { key: 'executionEvidence', label: 'Unggah bukti pelaksanaan', kind: 'execution-upload', hint: 'Foto lapangan atau PDF dapat diunggah lebih dari satu berkas.' },
  ],
  [
    { key: 'monitoring-heading', label: 'Status dan tindak lanjut', kind: 'heading', hint: 'Pantau pekerjaan yang telah dilaksanakan. Pilih PIC dari penugasan yang sudah dibuat pada tahap 3.' },
    { key: 'progress', label: 'Status tindak lanjut', kind: 'select', options: ['Belum mulai', 'Dalam proses', 'Butuh bantuan', 'Selesai'], required: true },
    { key: 'followUpOwner', label: 'PIC tindak lanjut', kind: 'select', required: true, hint: 'Daftar PIC berasal dari pembagian peran pada tahap 3.' },
    { key: 'followUpDue', label: 'Target penyelesaian', kind: 'date', required: true },
    { key: 'followUpNotes', label: 'Tindakan berikutnya dan hasil pemantauan', kind: 'textarea', required: true, hint: 'Ringkas tindakan yang harus dilakukan, hambatan, atau hasil koordinasi.' },
    { key: 'escalation-heading', label: 'Bila ada hambatan', kind: 'heading', hint: 'Pilih hanya jika pekerjaan memerlukan tindakan dari pihak lain. Tidak semua pekerjaan perlu dieskalasi atau dilimpahkan.' },
    { key: 'escalation', label: 'Tindakan yang diperlukan', kind: 'select', options: ['Tidak diperlukan', 'Koordinasi dengan stakeholder', 'Eskalasi ke pimpinan', 'Pelimpahan tugas ke stakeholder'], required: true },
    { key: 'handoffTo', label: 'Stakeholder tujuan pelimpahan', kind: 'select', options: [...externalOrganizations], hint: 'Pilih pihak yang menerima tanggung jawab lanjutan.' },
    { key: 'handoffReason', label: 'Tugas yang dilimpahkan', kind: 'textarea', hint: 'Jelaskan alasan, ruang lingkup, dan hasil yang diharapkan.' },
  ],
  [
    { key: 'evaluation-context', label: 'Ringkasan penanganan', kind: 'evaluation-context' },
    { key: 'evaluation-heading', label: 'Evaluasi penanganan', kind: 'heading', hint: 'Gunakan ringkasan di atas. Tidak perlu menyalin ulang uraian pelaksanaan atau catatan monitoring.' },
    { key: 'evaluation', label: 'Kesimpulan evaluasi', kind: 'textarea', required: true, hint: 'Nilai hasil respons, kendala utama, dan hal yang perlu diperbaiki.' },
    { key: 'lossAmount', label: 'Perkiraan kerugian negara (Rp)', kind: 'number', hint: 'Isi 0 jika tidak ada atau belum dapat diidentifikasi.' },
    { key: 'lossBasis', label: 'Dasar perhitungan kerugian', kind: 'textarea', hint: 'Wajib diisi jika nilai kerugian lebih dari 0.' },
    { key: 'map-heading', label: 'Keputusan pembaruan peta', kind: 'heading', hint: 'Pilih perubahan peta yang diperlukan berdasarkan hasil penanganan.' },
    { key: 'mapAction', label: 'Tindakan pada peta prioritas', kind: 'select', options: ['Tidak ada perubahan peta', 'Tambahkan titik prioritas', 'Perbarui tingkat risiko', 'Tandai lokasi untuk pemantauan'], required: true },
    { key: 'mapUpdateDetails', label: 'Rincian pembaruan peta', kind: 'textarea', hint: 'Jelaskan titik, tingkat risiko, atau alasan penandaan.' },
    { key: 'sop-heading', label: 'Keputusan pembaruan SOP', kind: 'heading', hint: 'SOP tidak perlu diperbarui untuk setiap kasus.' },
    { key: 'sopAction', label: 'Tindakan pada SOP', kind: 'select', options: ['Tidak ada pembaruan SOP', 'Perbarui SOP yang ada', 'Usulkan SOP atau ketentuan baru'], required: true },
    { key: 'sopUpdateDetails', label: 'Rincian pembaruan SOP', kind: 'textarea', hint: 'Jelaskan bagian SOP atau ketentuan yang perlu ditindaklanjuti.' },
  ],
];
const date = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const money = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const stageName = (n: number) => stages[Math.min(n, 7)];

function DateTimePicker({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const selected = value ? new Date(`${value}:00`) : undefined;
  const time = value.includes('T') ? value.slice(11, 16) : '';
  const setDate = (next?: Date) => {
    if (!next) return;
    const datePart = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    onChange(`${datePart}T${time || '00:00'}`);
  };
  const [hour = '00', minute = '00'] = time.split(':');
  const setTime = (nextHour: string, nextMinute: string) => { const datePart = value.split('T')[0]; if (datePart) onChange(`${datePart}T${nextHour}:${nextMinute}`); };
  return <div className="date-time-picker"><Popover><PopoverTrigger asChild><button id={id} type="button" className="secondary date-time-trigger"><CalendarDays size={16} />{selected ? selected.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Pilih tanggal'}</button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={selected} onSelect={setDate} initialFocus /></PopoverContent></Popover><select aria-label="Jam kejadian format 24 jam" value={hour} onChange={(event) => setTime(event.target.value, minute)}>{Array.from({ length: 24 }, (_, value) => String(value).padStart(2, '0')).map((value) => <option value={value} key={value}>{value}</option>)}</select><select aria-label="Menit kejadian" value={minute} onChange={(event) => setTime(hour, event.target.value)}>{Array.from({ length: 60 }, (_, value) => String(value).padStart(2, '0')).map((value) => <option value={value} key={value}>{value}</option>)}</select></div>;
}

function EvaluationContext({ incident }: { incident: Incident }) {
  const data = incident.data;
  const rows = [
    ['Rencana respons', String(data.responsePlan || 'Belum dicatat')],
    ['Pelaksanaan dan hasil sementara', String(data.executionNotes || 'Belum dicatat')],
    ['Status monitoring', String(data.progress || 'Belum dicatat')],
    ['PIC dan target', `${String(data.followUpOwner || 'Belum ditetapkan')} · ${String(data.followUpDue || 'Belum ditetapkan')}`],
    ['Tindakan berikutnya', String(data.followUpNotes || 'Belum dicatat')],
  ];
  return <section className="evaluation-context"><div className="evaluation-context-head"><div><span>REFERENSI</span><h3>Ringkasan penanganan sebelumnya</h3><p>Gunakan sebagai dasar evaluasi. Data ini tidak dapat diubah pada tahap ini.</p></div><strong>{incident.id}</strong></div><div className="evaluation-context-grid">{rows.map(([label, value], index) => <article className={index === 0 ? 'evaluation-summary-card wide' : 'evaluation-summary-card'} key={label}><b>{label}</b><p>{value}</p></article>)}</div></section>;
}

export default function Dashboard({ access }: { access: Access }) {
  const external = access.role === 'external_stakeholder';
  const [view, setView] = useState<View>('dashboard');
  const [stageFilter, setStageFilter] = useState(0);
  const [reviewStage, setReviewStage] = useState<number | null>(null);
  const [items, setItems] = useState<Incident[]>([]);
  const [historicalRecords, setHistoricalRecords] = useState<HistoricalIncident[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const notificationEpoch = useRef(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [mapSelection, setMapSelection] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'internal_receiver', organization: 'DKP' });
  const [passwordTarget, setPasswordTarget] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [profileName, setProfileName] = useState(access.name);
  const [profileJobTitle, setProfileJobTitle] = useState(access.jobTitle);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(access.hasProfilePhoto ? '/api/profile' : '');
  const [assignments, setAssignments] = useState<string[]>([]);
  const [updates, setUpdates] = useState<StakeholderUpdate[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [sopDocuments, setSopDocuments] = useState<SopDocument[]>([]);
  const [sopForm, setSopForm] = useState({ title: '', category: '', version: '', referenceUrl: '', notes: '' });
  const [evidence, setEvidence] = useState<EvidencePhoto[]>([]);
  const [verificationEvidence, setVerificationEvidence] = useState<VerificationEvidence[]>([]);
  const [stakeholderDocuments, setStakeholderDocuments] = useState<StakeholderDocument[]>([]);
  const [approvers, setApprovers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [approval, setApproval] = useState<ApprovalState>({ record: null, history: [] });
  const [approvalDocuments, setApprovalDocuments] = useState<ApprovalDocument[]>([]);
  const [uploadingApproval, setUploadingApproval] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVerificationEvidence, setUploadingVerificationEvidence] = useState(false);
  const [updateNote, setUpdateNote] = useState('');
  const [filter, setFilter] = useState('Semua status');
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const [form, setForm] = useState({ reporter: '', contact: '', description: '', location: '', category: '' });
  const incident = items.find((x) => x.id === selected);
  const load = useCallback(async () => {
    try { const response = await fetch('/api/incidents', { cache: 'no-store' }); const data = await response.json() as Incident[] & { error?: string }; if (!response.ok) throw new Error(data.error); setItems(data); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Data tidak dapat dimuat.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); void loadNotifications(); }, [load]);
  useEffect(() => { if (view === 'historical') void loadHistoricalRecords(); }, [view]);
  useEffect(() => {
    if (view !== 'historical') return;
    const description = document.querySelector<HTMLElement>('.head p');
    if (description) description.textContent = 'Rekap insiden yang tersimpan dan tersinkron dari MySQL SIRATSI.';
    const notes = document.querySelectorAll<HTMLElement>('.source-note');
    if (notes[0]) notes[0].textContent = 'Sumber: tabel MySQL historical_incidents. Rekap dihitung otomatis dari insiden yang tercatat di SIRATSI.';
    if (notes[1]) notes[1].textContent = 'Sumber: tabel MySQL historical_incidents. Baris hanya menampilkan insiden kategori Kecelakaan laut yang tercatat di SIRATSI.';
    if (notes[2]) notes[2].textContent = 'Data pemberdayaan masyarakat belum tersedia pada tabel historis MySQL.';
  }, [view, historicalRecords]);
  useEffect(() => {
    const applyPath = () => {
      const target = viewFromPath(window.location.pathname);
      if (!canAccessPage(access, target.view, target.stage)) {
        window.history.replaceState({}, '', viewPaths.dashboard);
        setView('dashboard');
        setError('Halaman tersebut tidak tersedia untuk peran akun Anda.');
        return;
      }
      setView(target.view);
      if (target.stage !== undefined) setStageFilter(target.stage);
    };
    applyPath(); window.addEventListener('popstate', applyPath); return () => window.removeEventListener('popstate', applyPath);
  }, [access]);
  async function loadNotifications() {
    const epoch = ++notificationEpoch.current;
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) throw new Error('Notifikasi tidak tersedia');
      const result = await response.json() as { unreadIds: string[] };
      if (epoch === notificationEpoch.current) setUnreadIds(result.unreadIds);
    } catch { /* The incident list remains usable if notifications are unavailable. */ }
  }
  async function loadHistoricalRecords() {
    try {
      const response = await fetch('/api/historical-incidents', { cache: 'no-store' });
      const data = await response.json() as HistoricalIncident[] & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Arsip historis tidak tersedia.');
      setHistoricalRecords(data);
    } catch (error) { setError(error instanceof Error ? error.message : 'Arsip historis tidak dapat dimuat.'); }
  }
  async function markRead(x: Incident) {
    notificationEpoch.current += 1;
    setUnreadIds((previous) => previous.filter((id) => id !== x.id));
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(x.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updatedAt: x.updated_at }) });
      await loadNotifications();
    } catch { await loadNotifications(); }
  }

  useEffect(() => { if (view === 'users' && access.role === 'super_admin') void loadUsers(); }, [view, access.role]);
  useEffect(() => {
    if (view !== 'users' || access.role !== 'super_admin') return;
    const select = document.getElementById('user-role') as HTMLSelectElement | null;
    if (!select || select.querySelector('option[value="response_executor"]')) return;
    const option = document.createElement('option');
    option.value = 'response_executor'; option.textContent = 'Pelaksana respons';
    select.insertBefore(option, select.querySelector('option[value="external_stakeholder"]'));
  }, [view, access.role, userForm.role]);
  useEffect(() => { if (view === 'sop') void loadSop(); }, [view]);
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: Record<string, unknown>, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const register = (tool: Record<string, unknown>) => { try { void Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(console.error); } catch (e) { console.error(e); } };
    register({ name: 'list_siratsi_information', title: 'Daftar informasi SIRATSI', description: 'Baca daftar informasi dan status penanganan yang tercatat.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, async execute() { const r = await fetch('/api/incidents'); if (!r.ok) throw new Error('Data tidak tersedia'); const records = await r.json() as Incident[]; return records.map((x: Incident) => ({ id: x.id, category: x.category, location: x.location, stage: stageName(x.stage), priority: x.priority })); } });
    register({ name: 'create_siratsi_information', title: 'Catat informasi SIRATSI', description: 'Simpan laporan informasi baru dan perbarui tampilan daftar.', inputSchema: { type: 'object', properties: { reporter: { type: 'string' }, contact: { type: 'string' }, description: { type: 'string' }, location: { type: 'string' }, category: { type: 'string' } }, required: ['reporter','contact','description','location','category'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, async execute(input: unknown) { const value = input as Record<string, unknown>; if (!value || !['reporter','contact','description','location','category'].every((k) => typeof value[k] === 'string' && String(value[k]).trim())) throw new Error('Semua kolom wajib diisi.'); const r = await fetch('/api/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }); const result = await r.json() as { id: string; error?: string }; if (!r.ok) throw new Error(result.error); await load(); setSelected(result.id!); setView('detail'); return { id: result.id, status: 'tercatat' }; } });
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    if (!incident) return;
    const data = { ...(incident.data || {}) };
    if (data.escalation === 'Perlu notifikasi stakeholder') data.escalation = 'Koordinasi dengan stakeholder';
    if (data.escalation === 'Pelimpahan ke stakeholder') data.escalation = 'Pelimpahan tugas ke stakeholder';
    setDraft(data);
  }, [selected, incident?.updated_at]);
  useEffect(() => {
    if (!incident || incident.stage !== 0) return;
    setDraft((previous) => ({
      ...previous,
      verifiedReporterName: previous.verifiedReporterName || incident.reporter,
      verifiedReporterContact: previous.verifiedReporterContact || incident.contact,
      occurrenceLocation: previous.occurrenceLocation || incident.location,
      verifiedBy: previous.verifiedBy || `${access.name}${access.organization ? ` — ${access.organization}` : ''}`,
    }));
  }, [incident?.id, incident?.stage, incident?.reporter, incident?.contact, incident?.location, access.name, access.organization]);
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(''), 4000); return () => clearTimeout(t); }, [message]);
  const filtered = useMemo(() => items.filter((x) => {
    const match = `${x.id} ${x.location} ${x.description} ${x.reporter} ${x.category}`.toLowerCase().includes(search.toLowerCase());
    return match && (filter === 'Semua status' || (filter === 'Selesai' ? x.stage === 7 : filter === 'Aktif' ? x.stage < 7 && x.data.caseStatus !== 'Ditolak' : x.priority === filter));
  }), [items, search, filter]);
  const active = items.filter((x) => x.stage < 7 && x.data.caseStatus !== 'Ditolak').length;
  const high = items.filter((x) => ['Tinggi', 'Kritis'].includes(x.priority) && x.stage < 7).length;
  const completed = items.filter((x) => x.stage === 7).length;
  const categories = ['Illegal fishing', 'Pencemaran laut', 'Kecelakaan laut', 'Penyelundupan', 'Gangguan keamanan', 'Lainnya'].map((name) => ({ name, value: items.filter((x) => x.category === name).length }));
  const historicalCases = useMemo(() => {
    const grouped = new Map<number, { explosive: number; fishing: number; other: number }>();
    for (const incident of historicalRecords) {
      const year = new Date(incident.firstRecordedAt).getFullYear();
      const row = grouped.get(year) || { explosive: 0, fishing: 0, other: 0 };
      const content = `${incident.category} ${incident.description}`.toLowerCase();
      if (incident.category === 'Illegal fishing') row.fishing += 1;
      else if (content.includes('bom') || content.includes('peledak')) row.explosive += 1;
      else row.other += 1;
      grouped.set(year, row);
    }
    return [...grouped.entries()].sort(([a], [b]) => a - b).map(([year, counts]) => ({ year, ...counts }));
  }, [historicalRecords]);
  const accidents = useMemo(() => historicalRecords.filter((incident) => incident.category === 'Kecelakaan laut').map((incident) => ({ year: new Date(incident.firstRecordedAt).getFullYear(), type: incident.category, placeTime: `${incident.location}\n${date(incident.firstRecordedAt)}`, impact: incident.description, source: 'historical_incidents' })), [historicalRecords]);
  const community = { inhabitedIslands: [] as string[], developedIslands: [] as string[], groups: 0 };
  const maxCategory = Math.max(1, ...categories.map((x) => x.value));
  const statuses = [{ name: 'Penanganan awal', count: items.filter((x) => x.stage < 4).length, color: '#0874ba' }, { name: 'Tindak lanjut', count: items.filter((x) => x.stage >= 4 && x.stage < 7).length, color: '#e4a43a' }, { name: 'Selesai', count: completed, color: '#16a77c' }];
  let percent = 0;
  const donut = items.length ? `conic-gradient(${statuses.map((x) => { const start = percent; percent += x.count / items.length * 100; return `${x.color} ${start}% ${percent}%`; }).join(',')})` : 'conic-gradient(#dce9f1 0 100%)';
  const recentMonths = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('id-ID', { month: 'short' }) }; });
  const monthly = recentMonths.map((month) => ({ ...month, count: items.filter((x) => x.created_at.startsWith(month.key)).length, completed: items.filter((x) => x.created_at.startsWith(month.key) && x.stage === 7).length, loss: items.filter((x) => x.created_at.startsWith(month.key)).reduce((sum, x) => sum + (Number(x.data.lossAmount) || 0), 0) }));
  const maxMonthly = Math.max(1, ...monthly.map((x) => x.count));
  const maxLoss = Math.max(1, ...monthly.map((x) => x.loss));
  const linePoints = (key: 'count' | 'completed') => monthly.map((x, i) => `${20 + i * 56},${110 - x[key] / maxMonthly * 92}`).join(' ');
  const recordedPoints: MapMarker[] = items.flatMap((x) => {
    const coordinate = parseCoordinates(x.data.coordinates);
    return coordinate ? [{ ...coordinate, id: x.id, title: `${x.id} · ${x.location}`, category: x.category, description: x.description, status: x.stage === 7 ? 'Selesai' : stageName(x.stage), priority: x.priority }] : [];
  });
  const hotSpots: { lat: number; lng: number; cases: MapMarker[] }[] = [];
  for (const point of recordedPoints) {
    const cluster = hotSpots.find((group) => {
      const a = (point.lat - group.lat) * Math.PI / 180;
      const b = (point.lng - group.lng) * Math.PI / 180;
      const distance = 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(Math.sin(a / 2) ** 2 + Math.cos(point.lat * Math.PI / 180) * Math.cos(group.lat * Math.PI / 180) * Math.sin(b / 2) ** 2)));
      return distance <= 10;
    });
    if (cluster) { cluster.cases.push(point); cluster.lat = cluster.cases.reduce((sum, x) => sum + x.lat, 0) / cluster.cases.length; cluster.lng = cluster.cases.reduce((sum, x) => sum + x.lng, 0) / cluster.cases.length; }
    else hotSpots.push({ lat: point.lat, lng: point.lng, cases: [point] });
  }
  hotSpots.sort((a, b) => b.cases.length - a.cases.length);
  const notifications = [...items].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);
  const fieldResponses = items.filter((x) => x.stage >= 4 && x.stage < 7).slice(0, 5);
  const picDeadlines = items.filter((x) => x.stage === 2 || x.stage === 5).filter((x) => x.data.followUpOwner || readStakeholderRows(x.data.stakeholderRoles).length).slice(0, 5);
  const escalatedCases = items.filter((x) => x.stage === 5 && x.data.escalation && x.data.escalation !== 'Tidak diperlukan').slice(0, 5);
  const loss = items.reduce((sum, x) => sum + (Number(x.data.lossAmount) || 0), 0);
  function selectLocation(point: { lat: number; lng: number }) { setDraft((previous) => ({ ...previous, coordinates: formatCoordinates(point) })); setError(''); }
  function open(x: Incident) { void markRead(x); setReviewStage(null); setEvidence([]); setVerificationEvidence([]); setStakeholderDocuments([]); setAuditEvents([]); setApproval({ record: null, history: [] }); setApprovalDocuments([]); setSelected(x.id); setView('detail'); setError(''); setMobileMenu(false); void loadDetails(x.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function navigate(next: View) {
    if (!canAccessPage(access, next)) { setError('Halaman tersebut tidak tersedia untuk peran akun Anda.'); return; }
    const path = viewPaths[next]; if (path && window.location.pathname !== path) window.history.pushState({}, '', path); setView(next); setError(''); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goToStage(stage: number) {
    if (!canAccessPage(access, 'stage', stage)) { setError('Tahap tersebut tidak tersedia untuk peran akun Anda.'); return; }
    const path = stagePaths[stage]; if (path && window.location.pathname !== path) window.history.pushState({}, '', path); setStageFilter(stage); setView('stage'); setError(''); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function loadUsers() { try { const r = await fetch('/api/users'); const data = await r.json() as ManagedUser[] & { error?: string }; if (!r.ok) throw new Error(data.error); setUsers(data); } catch (e) { setError(e instanceof Error ? e.message : 'Daftar pengguna belum dapat dimuat.'); } }
  async function loadSop() { try { const r = await fetch('/api/sop', { cache: 'no-store' }); const data = await r.json() as SopDocument[] & { error?: string }; if (!r.ok) throw new Error(data.error); setSopDocuments(data); } catch (e) { setError(e instanceof Error ? e.message : 'Repositori SOP belum dapat dimuat.'); } }
  async function addSop(e: React.FormEvent) { e.preventDefault(); setSaving(true); setError(''); try { const r = await fetch('/api/sop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sopForm) }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); setSopForm({ title: '', category: '', version: '', referenceUrl: '', notes: '' }); await loadSop(); setMessage('SOP atau regulasi tersimpan.'); } catch (err) { setError(err instanceof Error ? err.message : 'Dokumen belum tersimpan.'); } finally { setSaving(false); } }
  async function loadDetails(id: string) { try {
    const [a, u, p, verificationFiles, d, approvalResponse, approvalFiles, leaders, audit] = await Promise.all([
      fetch(`/api/incidents/${encodeURIComponent(id)}/assignments`),
      fetch(`/api/incidents/${encodeURIComponent(id)}/updates`),
      fetch(`/api/incidents/${encodeURIComponent(id)}/evidence`, { cache: 'no-store' }),
      fetch(`/api/incidents/${encodeURIComponent(id)}/verification-evidence`, { cache: 'no-store' }),
      fetch(`/api/incidents/${encodeURIComponent(id)}/documents`, { cache: 'no-store' }),
      fetch(`/api/incidents/${encodeURIComponent(id)}/approval`, { cache: 'no-store' }),
      fetch(`/api/incidents/${encodeURIComponent(id)}/approval-documents`, { cache: 'no-store' }),
      fetch('/api/approvers', { cache: 'no-store' }),
      fetch(`/api/incidents/${encodeURIComponent(id)}/audit`, { cache: 'no-store' }),
    ]);
    if (a.ok) setAssignments(await a.json() as string[]);
    if (u.ok) setUpdates(await u.json() as StakeholderUpdate[]);
    if (p.ok) setEvidence(await p.json() as EvidencePhoto[]);
    if (verificationFiles.ok) setVerificationEvidence(await verificationFiles.json() as VerificationEvidence[]);
    if (d.ok) setStakeholderDocuments(await d.json() as StakeholderDocument[]);
    if (approvalResponse.ok) setApproval(await approvalResponse.json() as ApprovalState);
    if (approvalFiles.ok) setApprovalDocuments(await approvalFiles.json() as ApprovalDocument[]);
    if (leaders.ok) setApprovers(await leaders.json() as { id: string; name: string; role: string }[]);
    if (audit.ok) setAuditEvents(await audit.json() as AuditEvent[]);
  } catch { setError('Rincian kasus belum dapat dimuat.'); } }
  async function submitApproval() {
    if (!incident) return; setSaving(true); setError('');
    try { const r = await fetch(`/api/incidents/${encodeURIComponent(incident.id)}/approval`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: draft }) }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); await load(); await loadDetails(incident.id); setMessage('Rencana diajukan kepada pimpinan.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Pengajuan gagal.'); } finally { setSaving(false); }
  }
  async function decideApproval(decision: 'approved' | 'rejected', note: string) {
    if (!incident) return; setSaving(true); setError('');
    try { const r = await fetch(`/api/incidents/${encodeURIComponent(incident.id)}/approval/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision, note }) }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); await load(); await loadDetails(incident.id); await loadNotifications(); setMessage(decision === 'approved' ? 'Respons disetujui. Tahap pelaksanaan terbuka.' : 'Respons ditolak dan dapat direvisi.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Keputusan gagal disimpan.'); } finally { setSaving(false); }
  }
  async function uploadApprovalDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    if (!incident) return; const files = Array.from(event.target.files || []); event.target.value = '';
    if (files.length + approvalDocuments.length > 5) { setError('Maksimal 5 lampiran.'); return; }
    setUploadingApproval(true); setError('');
    try { for (const file of files) { const body = new FormData(); body.append('document', file); const r = await fetch(`/api/incidents/${encodeURIComponent(incident.id)}/approval-documents`, { method: 'POST', body }); const result = await r.json() as { error?: string }; if (!r.ok) throw new Error(result.error); } setMessage('Lampiran persetujuan tersimpan.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Lampiran gagal diunggah.'); } finally { await loadDetails(incident.id); setUploadingApproval(false); }
  }
  async function uploadStakeholderDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    if (!incident) return;
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (files.length + stakeholderDocuments.length > 5) { setError('Maksimal 5 lampiran per kasus.'); return; }
    setUploadingDocuments(true); setError('');
    try {
      for (const file of files) {
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Pilih PDF, JPG, atau PNG maksimal 10 MB per file.');
        const body = new FormData(); body.append('document', file);
        const response = await fetch(`/api/incidents/${encodeURIComponent(incident.id)}/documents`, { method: 'POST', body });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || 'Unggah lampiran gagal.');
      }
      setMessage(`${files.length} lampiran tersimpan.`);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unggah lampiran gagal.'); }
    finally { await loadDetails(incident.id); setUploadingDocuments(false); }
  }
  async function uploadEvidence(event: React.ChangeEvent<HTMLInputElement>) {
    if (!incident) return;
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (files.length + evidence.length > 8) { setError('Maksimal 8 foto per kasus.'); return; }
    setUploading(true); setError('');
    try {
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Pilih foto JPG, PNG, atau WebP maksimal 5 MB per foto.');
        const body = new FormData(); body.append('photo', file);
        const response = await fetch(`/api/incidents/${encodeURIComponent(incident.id)}/evidence`, { method: 'POST', body });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || 'Unggah foto gagal.');
      }
      setMessage(`${files.length} foto berhasil diunggah.`);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unggah foto gagal.'); }
    finally { await loadDetails(incident.id); setUploading(false); }
  }
  async function uploadVerificationEvidence(files: File[]) {
    if (!incident || !files.length) return;
    if (files.length + verificationEvidence.length > 8) { setError('Maksimal 8 bukti pendukung per informasi.'); return; }
    setUploadingVerificationEvidence(true); setError('');
    try {
      for (const file of files) {
        if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/wav'].includes(file.type) || file.size > 15 * 1024 * 1024) throw new Error('Pilih PDF, JPG, PNG, WebP, MP4, MP3, atau WAV maksimal 15 MB per file.');
        const body = new FormData(); body.append('evidence', file);
        const response = await fetch(`/api/incidents/${encodeURIComponent(incident.id)}/verification-evidence`, { method: 'POST', body });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || 'Unggah bukti pendukung gagal.');
      }
      setMessage(`${files.length} bukti pendukung tersimpan.`);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unggah bukti pendukung gagal.'); }
    finally { await loadDetails(incident.id); setUploadingVerificationEvidence(false); }
  }
  async function uploadProfilePhoto(event: React.ChangeEvent<HTMLInputElement>) { const photo = event.target.files?.[0]; if (!photo) return; if (photo.size > 2 * 1024 * 1024) { setError('Ukuran foto maksimal 2 MB.'); return; } setSaving(true); setError(''); try { const body = new FormData(); body.append('photo', photo); const r = await fetch('/api/profile', { method: 'POST', body }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); setProfilePhotoPreview(URL.createObjectURL(photo)); setMessage('Foto profil diperbarui.'); } catch (err) { setError(err instanceof Error ? err.message : 'Foto profil belum tersimpan.'); } finally { setSaving(false); } }
  async function saveProfile(e: React.FormEvent) { e.preventDefault(); setSaving(true); setError(''); try { const r = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profileName, jobTitle: profileJobTitle }) }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); setMessage('Profil diperbarui.'); window.setTimeout(() => window.location.reload(), 500); } catch (err) { setError(err instanceof Error ? err.message : 'Profil belum tersimpan.'); } finally { setSaving(false); } }
  async function addUser(e: React.FormEvent) { e.preventDefault(); setSaving(true); setError(''); try { const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm) }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); setUserForm({ name: '', email: '', password: '', role: 'internal_receiver', organization: 'DKP' }); await loadUsers(); setMessage('Pengguna ditambahkan dan dapat masuk dengan email serta kata sandinya.'); } catch (e) { setError(e instanceof Error ? e.message : 'Pengguna belum tersimpan.'); } finally { setSaving(false); } }
  async function updatePassword(id: string) {
    if (newPassword.length < 12) { setError('Kata sandi harus minimal 12 karakter.'); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(id)}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Kata sandi belum tersimpan.');
      setNewPassword(''); setPasswordTarget(null); await loadUsers(); setMessage('Kata sandi diperbarui. Sesi lama pengguna telah diakhiri.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Kata sandi belum tersimpan.'); }
    finally { setSaving(false); }
  }
  async function toggleUser(user: ManagedUser) { setError(''); try { const r = await fetch(`/api/users/${encodeURIComponent(user.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !user.active }) }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); await loadUsers(); setMessage('Status pengguna diperbarui.'); } catch (e) { setError(e instanceof Error ? e.message : 'Status belum tersimpan.'); } }
  async function saveAssignments() { if (!incident) return; setSaving(true); setError(''); try { const r = await fetch(`/api/incidents/${encodeURIComponent(incident.id)}/assignments`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizations: assignments }) }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); await loadDetails(incident.id); setMessage('Penugasan instansi tersimpan.'); } catch (e) { setError(e instanceof Error ? e.message : 'Penugasan belum tersimpan.'); } finally { setSaving(false); } }
  async function sendUpdate(e: React.FormEvent) { e.preventDefault(); if (!incident) return; setSaving(true); setError(''); try { const r = await fetch(`/api/incidents/${encodeURIComponent(incident.id)}/updates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: updateNote }) }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); setUpdateNote(''); await loadDetails(incident.id); setMessage('Catatan tindak lanjut terkirim.'); } catch (e) { setError(e instanceof Error ? e.message : 'Catatan belum terkirim.'); } finally { setSaving(false); } }
  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try { const response = await fetch('/api/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const result = await response.json() as { id?: string; error?: string }; if (!response.ok) throw new Error(result.error); await load(); setSelected(result.id!); setView('detail'); setForm({ reporter: '', contact: '', description: '', location: '', category: '' }); setMessage('Informasi berhasil dicatat. Lanjutkan verifikasi.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan.'); } finally { setSaving(false); }
  }
  async function save(next = false) {
    if (!incident) return;
    const fields = forms[incident.stage];
    if (next && fields) { const missing = fields.filter((f) => f.required && !String(draft[f.key] ?? '').trim()); if (missing.length) { setError(`Lengkapi: ${missing.map((f) => f.label).join(', ')}.`); return; } }
    if (next && incident.stage === 2) {
      const roles = readStakeholderRows(draft.stakeholderRoles);
      if (!roles.length || !roles.some((row) => row.kind === 'internal' && row.role === 'Koordinator') || roles.some((row) => !row.task.trim() || !row.pic.trim() || !row.due)) {
        setError('Pilih koordinator internal dan lengkapi peran, tugas, PIC, serta batas waktu semua stakeholder.'); return;
      }
    }
    if (next && incident.stage === 1 && !parseCoordinates(draft.coordinates)) { setError('Pilih titik pada peta atau isi koordinat lintang, bujur yang valid.'); return; }
    if (next && incident.stage === 0 && draft.verificationResult !== 'Valid / dapat ditindaklanjuti') { setError('Gunakan Simpan draf untuk Perlu pendalaman atau Tidak valid. Hanya informasi Valid yang dapat diteruskan.'); return; }
    if (next && incident.stage === 5 && draft.progress !== 'Selesai') { setError('Monitoring belum selesai. Simpan draf dan pilih notifikasi/eskalasi bila tindak lanjut membutuhkan bantuan.'); return; }
    if (next && incident.stage === 6 && (!String(draft.evaluation || '').trim() || !String(draft.mapAction || '').trim() || !String(draft.sopAction || '').trim())) { setError('Lengkapi kesimpulan evaluasi serta keputusan pembaruan peta dan SOP.'); return; }
    if (next && incident.stage === 6 && Number(draft.lossAmount || 0) > 0 && !String(draft.lossBasis || '').trim()) { setError('Isi dasar perhitungan karena ada nilai kerugian yang dicatat.'); return; }
    if (next && incident.stage === 6 && draft.mapAction !== 'Tidak ada perubahan peta' && !String(draft.mapUpdateDetails || '').trim()) { setError('Jelaskan rincian pembaruan peta yang dipilih.'); return; }
    if (next && incident.stage === 6 && draft.sopAction !== 'Tidak ada pembaruan SOP' && !String(draft.sopUpdateDetails || '').trim()) { setError('Jelaskan rincian pembaruan SOP yang dipilih.'); return; }
    if (next && incident.stage === 6 && evidence.length === 0) { setError('Unggah minimal satu foto bukti dukung sebelum menyelesaikan kasus.'); return; }
    setSaving(true); setError('');
    try {
      const priority = incident.stage === 1 && draft.riskLevel ? String(draft.riskLevel) : incident.priority;
      const response = await fetch(`/api/incidents/${encodeURIComponent(incident.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: next ? incident.stage + 1 : incident.stage, priority, data: draft }) });
      const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error);
      await load(); await loadNotifications(); setMessage(next ? 'Tahapan berhasil dilanjutkan.' : 'Draf berhasil disimpan.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan.'); } finally { setSaving(false); }
  }
  const csv = () => {
    const headers = ['Nomor', 'Tanggal', 'Pelapor', 'Kontak', 'Kategori', 'Lokasi', 'Uraian', 'Tahap', 'Prioritas', 'Kerugian Negara (Rp)'];
    const cells = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const rows = filtered.map((x) => [x.id, date(x.created_at), x.reporter, x.contact, x.category, x.location, x.description, stageName(x.stage), x.priority, x.data.lossAmount || 0]);
    const blob = new Blob(['\uFEFF' + [headers, ...rows].map((r) => r.map(cells).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'laporan-siratsi.csv'; link.click(); URL.revokeObjectURL(url);
  };
  const nav: { key: View; label: string; icon: React.ReactNode; stage?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    ...(!external ? [
      { key: 'new' as View, label: 'Input Informasi', icon: <FilePlus2 size={19} /> },
      { key: 'stage' as View, label: 'Verifikasi Informasi', icon: <Radar size={19} />, stage: 0 },
      { key: 'map' as View, label: 'Peta Prioritas', icon: <MapPin size={19} /> },
      { key: 'stage' as View, label: 'Manajemen Stakeholder', icon: <Users size={19} />, stage: 2 },
      { key: 'stage' as View, label: 'Tentukan Respons', icon: <Crosshair size={19} />, stage: 3 },
      { key: 'stage' as View, label: 'Pelaksanaan Respons', icon: <Ship size={19} />, stage: 4 },
      { key: 'stage' as View, label: 'Monitor Tindak Lanjut', icon: <TrendingUp size={19} />, stage: 5 },
      { key: 'stage' as View, label: 'Evaluasi & Pembaruan', icon: <ClipboardCheck size={19} />, stage: 6 },
      { key: 'cases' as View, label: 'Daftar Informasi', icon: <FileText size={19} /> },
    ] : [{ key: 'cases' as View, label: 'Informasi Ditugaskan', icon: <FileText size={19} /> }]),
    { key: 'reports', label: 'Laporan', icon: <BarChart3 size={19} /> },
    { key: 'notifications', label: 'Notifikasi', icon: <Bell size={19} /> },
    ...(!external ? [{ key: 'historical' as View, label: 'Data Historis', icon: <Activity size={19} /> }, { key: 'flow' as View, label: 'Alur Kerja', icon: <Compass size={19} /> }] : []),
    ...(access.role === 'super_admin' ? [{ key: 'users' as View, label: 'Pengaturan Pengguna', icon: <Settings2 size={19} /> }] : []),
  ].filter((item) => canAccessPage(access, item.key, item.stage));
  const goToMenu = (item: typeof nav[number]) => item.stage === undefined ? navigate(item.key) : goToStage(item.stage);
  const field = (f: Field) => {
    if (f.kind === 'heading') return <div className="form-section-heading" key={f.key}><h3>{f.label}</h3><p>{f.hint}</p></div>;
    if (f.kind === 'evaluation-context') return incident ? <EvaluationContext key={f.key} incident={incident} /> : null;
    if ((f.key === 'handoffTo' || f.key === 'handoffReason') && draft.escalation !== 'Pelimpahan tugas ke stakeholder') return null;
    if (f.key === 'lossBasis' && Number(draft.lossAmount || 0) <= 0) return null;
    if (f.key === 'mapUpdateDetails' && draft.mapAction === 'Tidak ada perubahan peta') return null;
    if (f.key === 'sopUpdateDetails' && draft.sopAction === 'Tidak ada pembaruan SOP') return null;
    if (f.kind === 'execution-upload') return <div className="field execution-evidence-field" key={f.key}><label>{f.label}</label>{incident ? <ExecutionEvidenceUploader incidentId={incident.id} /> : null}</div>;
    if (f.kind === 'upload') return <div className="field verification-evidence-field" key={f.key}><label>{f.label}</label>{incident ? <VerificationEvidenceUploader incidentId={incident.id} /> : null}</div>;
    const stakeholderRows = readStakeholderRows(draft.stakeholderRoles);
    const options = f.key === 'executionTeam' ? stakeholderRows.map((row) => row.name) : f.key === 'followUpOwner' ? [...new Set(stakeholderRows.map((row) => row.pic.trim()).filter(Boolean))] : f.options;
    return <div className="field" key={f.key}><label htmlFor={f.key}>{f.label}{f.required ? ' *' : ''}</label>{f.kind === 'checkbox' ? <label className="check-row"><input id={f.key} type="checkbox" checked={Boolean(draft[f.key])} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })} />Ya, sudah diperbarui</label> : f.kind === 'select' ? <Select value={String(draft[f.key] || '')} onValueChange={(v) => setDraft({ ...draft, [f.key]: v })}><SelectTrigger id={f.key} className="!w-full !h-11 !bg-white"><SelectValue placeholder={f.key === 'executionTeam' && !options?.length ? 'Belum ada stakeholder tahap 3' : 'Pilih opsi'} /></SelectTrigger><SelectContent>{options?.map((v) => <SelectItem value={v} key={v}>{v}</SelectItem>)}</SelectContent></Select> : f.kind === 'textarea' ? <textarea id={f.key} value={String(draft[f.key] || '')} placeholder={f.hint} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} /> : f.kind === 'datetime' ? <DateTimePicker id={f.key} value={String(draft[f.key] || '')} onChange={(value) => setDraft({ ...draft, [f.key]: value })} /> : f.kind === 'upload' ? <div className="verification-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void uploadVerificationEvidence(Array.from(event.dataTransfer.files)); }}><label className="upload-control" htmlFor="verification-evidence-upload"><ImagePlus size={21} /><span>{uploadingVerificationEvidence ? 'Mengunggah bukti...' : 'Pilih berkas atau seret ke sini'}</span></label><input className="visually-hidden" id="verification-evidence-upload" type="file" accept="application/pdf,image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/wav" multiple disabled={uploadingVerificationEvidence || verificationEvidence.length >= 8} onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ''; void uploadVerificationEvidence(files); }} />{verificationEvidence.length > 0 && <div className="list">{verificationEvidence.map((file) => <a className="flow-item" key={file.id} href={`/api/incidents/${encodeURIComponent(incident!.id)}/verification-evidence/${file.id}`} target="_blank" rel="noopener noreferrer"><b>{file.filename}</b><small>{Math.ceil(file.sizeBytes / 1024)} KB · {date(file.createdAt)}</small></a>)}</div>}</div> : <input id={f.key} type={f.kind === 'date' ? 'date' : f.kind === 'number' ? 'number' : 'text'} min={f.kind === 'number' ? '0' : undefined} value={String(draft[f.key] || '')} placeholder={f.hint} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />}{f.hint && f.kind !== 'text' && f.kind !== 'upload' && <small>{f.hint}</small>}</div>;
  };
  const badge = (x: Incident) => <span className={`badge ${x.data.caseStatus === 'Ditolak' ? 'high' : x.stage === 7 ? 'done' : ['Tinggi', 'Kritis'].includes(x.priority) ? 'high' : ''}`}>{x.stage === 7 ? 'Selesai' : String(x.data.caseStatus || stageName(x.stage))}</span>;
  const list = (source: Incident[]) => source.length ? <div className="list">{source.map((x) => <button className="incident" key={x.id} onClick={() => open(x)}><div><strong>{x.id} · {x.category}</strong><small>{date(x.created_at)} · {x.location} · {x.reporter}</small><p>{x.description}</p></div><div>{badge(x)}</div></button>)}</div> : <div className="empty"><strong>Belum ada informasi</strong>Catat laporan pertama melalui menu Input Informasi.</div>;
  return <div className="shell"><DashboardSidebar access={access} items={nav} unreadCount={unreadIds.length} active={(item) => (view === item.key && (item.stage === undefined || item.stage === stageFilter)) || (view === 'detail' && item.key === 'cases')} onNavigate={goToMenu} /><main className="main"><DashboardHeader access={access} unreadCount={unreadIds.length} onNotifications={() => navigate('notifications')} onProfileEdit={() => navigate('profile')} onMenu={() => setMobileMenu(true)} /><div className="content">{error && <div className="stage-box" role="alert" style={{ background: '#fff0f0', borderColor: '#efb8b8', color: '#a32930' }}>{error} <button type="button" onClick={() => { setError(''); load(); }} style={{ marginLeft: 10, textDecoration: 'underline' }}>Muat ulang</button></div>}
  {view === 'dashboard' && <><div className="head dashboard-head"><div><h1>Dashboard Situasi Keamanan Laut</h1><p>Pemantauan informasi dan respons wilayah perairan Lampung.</p></div><span className="dashboard-date"><CalendarDays size={16} /> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
  <div className="stats dashboard-stats">
    <button className="stat" onClick={() => navigate('cases')}><span className="stat-icon"><FileText /></span><div><strong>{items.length}</strong><span>Total informasi</span></div></button>
    <button className="stat" onClick={() => external ? navigate('cases') : goToStage(0)}><span className="stat-icon"><ShieldCheck /></span><div><strong>{items.filter((x) => x.stage >= 1).length}</strong><span>Terverifikasi</span></div></button>
    <button className="stat" onClick={() => navigate(external ? 'cases' : 'map')}><span className="stat-icon"><MapPin /></span><div><strong>{new Set(items.filter((x) => x.stage >= 1).map((x) => x.location)).size}</strong><span>Lokasi tercatat</span></div></button>
    <button className="stat" onClick={() => external ? navigate('cases') : goToStage(4)}><span className="stat-icon"><Ship /></span><div><strong>{active}</strong><span>Dalam penanganan</span></div></button>
    <button className="stat" onClick={() => navigate('cases')}><span className="stat-icon"><CheckCircle2 /></span><div><strong>{completed}</strong><span>Selesai</span></div></button>
    <button className="stat" onClick={() => navigate('reports')}><span className="stat-icon"><Coins /></span><div><strong>{money(loss)}</strong><span>Estimasi kerugian negara</span></div></button>
  </div>
  <div className="overview-grid"><section className="panel map-overview"><div className="section-bar dark"><h2>Peta Situasi dan Lokasi Prioritas</h2><span><span className="live-dot" /> Data kasus tercatat</span></div><div className="overview-map">{external ? <div className="assigned-areas"><MapPin size={34} /><h3>Wilayah informasi yang ditugaskan</h3>{[...new Set(items.map((x) => x.location))].length ? <div>{[...new Set(items.map((x) => x.location))].map((name) => <span key={name}>{name}</span>)}</div> : <p>Belum ada lokasi pada informasi yang ditugaskan.</p>}</div> : <><InteractiveMap markers={recordedPoints} autoFit onMarkerClick={(id) => { const chosen = items.find((x) => x.id === id); if (chosen) open(chosen); }} ariaLabel="Peta titik prioritas dari kasus SIRATSI" /><button onClick={() => navigate('map')} className="map-button">Analisis peta <ArrowRight size={16} /></button></>}</div><div className="map-caption"><MapPin size={16} /> {external ? `${new Set(items.map((x) => x.location)).size} lokasi pada informasi yang ditugaskan` : `${recordedPoints.length} titik tercatat · ${hotSpots.filter((group) => group.cases.length >= 2).length} konsentrasi dalam radius 10 km`}</div></section>
  <div className="overview-side"><section className="panel chart-panel"><div className="section-bar"><h2>Tren Kejadian</h2><small>6 bulan terakhir</small></div><p className="chart-subtitle">Jumlah informasi menurut bulan laporan</p><div className="line-chart" role="img" aria-label={`Grafik tren laporan: ${monthly.map((x) => `${x.label} ${x.count} laporan, ${x.completed} selesai`).join('; ')}`}><svg viewBox="0 0 320 135" preserveAspectRatio="none" aria-hidden="true"><path d="M20 18 H300 M20 64 H300 M20 110 H300" stroke="#dfebf3" strokeWidth="1" /><polyline points={linePoints('count')} fill="none" stroke="#e8454e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /><polyline points={linePoints('completed')} fill="none" stroke="#126adb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />{monthly.map((x,i) => <g key={x.key}><circle cx={20+i*56} cy={110-x.count/maxMonthly*92} r="3.5" fill="#e8454e" /><circle cx={20+i*56} cy={110-x.completed/maxMonthly*92} r="3.5" fill="#126adb" /></g>)}</svg><div className="line-labels">{monthly.map((x) => <span key={x.key}>{x.label}</span>)}</div></div><div className="chart-key"><span><i className="key-red" /> Informasi masuk</span><span><i className="key-blue" /> Selesai dari laporan bulan itu</span></div></section>
  <section className="panel status-panel"><div className="section-bar"><h2>Status Tindak Lanjut</h2></div><div className="donut-layout"><div className="donut-chart" style={{ background: donut }} role="img" aria-label={`Diagram donat: ${statuses.map((x) => `${x.name} ${x.count}`).join(', ')}`}><div className="donut-hole"><strong>{items.length}</strong><small>total kasus</small></div></div><div className="donut-legend">{statuses.map((x) => <div key={x.name}><span className="legend-dot" style={{ background: x.color }} /><span>{x.name}</span><strong>{x.count}</strong></div>)}</div></div></section></div>
  <div className="overview-side"><section className="panel notification-panel"><div className="section-bar"><h2>Notifikasi Terbaru</h2><button onClick={() => navigate('notifications')}>Lihat semua</button></div>{notifications.length ? <div className="notification-list">{notifications.map((x) => <button key={x.id} className={unreadIds.includes(x.id) ? 'unread' : ''} onClick={() => open(x)}><span className={`notice-icon ${x.stage === 7 ? 'done' : ['Tinggi','Kritis'].includes(x.priority) ? 'urgent' : ''}`}>{x.stage === 7 ? <CheckCircle2 size={18} /> : x.stage === 0 ? <Bell size={18} /> : <Activity size={18} />}</span><span><b>{unreadIds.includes(x.id) && <i className="unread-dot" aria-label="Belum dibaca" />} {x.stage === 0 ? 'Informasi baru masuk' : x.stage === 7 ? 'Laporan selesai' : `Tahap ${stageName(x.stage)}`}</b><small>{x.category} · {x.location}</small></span><time>{date(x.updated_at)}</time></button>)}</div> : <div className="chart-empty">Belum ada notifikasi kasus.</div>}</section>
  <section className="panel loss-panel"><div className="section-bar"><h2>Kerugian Negara <small>(estimasi)</small></h2><small>6 bulan terakhir</small></div><div className="loss-chart" role="img" aria-label={`Diagram batang kerugian: ${monthly.map((x) => `${x.label} ${money(x.loss)}`).join('; ')}`}>{monthly.map((x) => <div key={x.key} className="loss-column"><b>{x.loss ? new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(x.loss) : ''}</b><span style={{ height: `${x.loss ? Math.max(5, x.loss/maxLoss*100) : 2}%` }} /><small>{x.label}</small></div>)}</div><p className="source-note">Berdasarkan estimasi rupiah yang dicatat dalam evaluasi kasus.</p></section></div></div>
  <div className="dashboard-lower"><section className="panel"><div className="section-bar"><h2>Informasi Terbaru</h2><button onClick={() => navigate('cases')}>Lihat semua</button></div>{loading ? <div className="chart-empty">Memuat data...</div> : items.length ? <div className="recent-table"><div className="recent-table-head"><span>Tanggal</span><span>Lokasi</span><span>Uraian kejadian</span><span>Status</span></div>{items.slice(0,5).map((x) => <button key={x.id} onClick={() => open(x)}><time>{date(x.created_at)}</time><span>{x.location}</span><span>{x.category} · {x.description}</span>{badge(x)}</button>)}</div> : <div className="chart-empty">Belum ada informasi tercatat.</div>}</section>
  <section className="panel"><div className="section-bar"><h2>Respons Aktif di Lapangan</h2><button onClick={() => external ? navigate('cases') : goToStage(4)}>Lihat semua</button></div>{fieldResponses.length ? <div className="response-list">{fieldResponses.map((x) => <button key={x.id} onClick={() => open(x)}><span><b>{x.category}</b><small>{x.location}</small></span><span className="badge">{stageName(x.stage)}</span></button>)}</div> : <div className="chart-empty">Belum ada respons aktif.</div>}</section>
  <section className="panel"><div className="section-bar"><h2><Clock3 size={17} /> PIC dan Tenggat</h2><button onClick={() => external ? navigate('cases') : goToStage(5)}>Pantau</button></div>{picDeadlines.length ? <div className="response-list">{picDeadlines.map((x) => <button key={x.id} onClick={() => open(x)}><span><b>{x.data.followUpOwner || readStakeholderRows(x.data.stakeholderRoles)[0]?.pic || 'PIC belum ditetapkan'}</b><small>{x.id} · tenggat {x.data.followUpDue || readStakeholderRows(x.data.stakeholderRoles)[0]?.due || 'belum diisi'}</small></span><span className="badge">{stageName(x.stage)}</span></button>)}</div> : <div className="chart-empty">Belum ada PIC atau tenggat aktif.</div>}</section>
  <section className="panel"><div className="section-bar"><h2><AlertTriangle size={17} /> Temuan & Eskalasi</h2><button onClick={() => external ? navigate('cases') : goToStage(5)}>Lihat</button></div>{escalatedCases.length ? <div className="response-list">{escalatedCases.map((x) => <button key={x.id} onClick={() => open(x)}><span><b>{x.id} · {x.data.escalation}</b><small>{String(x.data.followUpNotes || 'Menunggu tindak lanjut eskalasi.')}</small></span><span className="badge high">Aktif</span></button>)}</div> : <div className="chart-empty">Tidak ada eskalasi aktif.</div>}</section>
  <section className="panel"><div className="section-bar"><h2>Dokumen & Pembaruan</h2></div><div className="quick-links">{!external && <button onClick={() => navigate('map')}><MapPin size={19} /><span><b>Peta prioritas</b><small>13 titik rawan · 14 pangkalan</small></span><ArrowRight size={15} /></button>}{!external && <button onClick={() => navigate('historical')}><FileText size={19} /><span><b>Data historis</b><small>Perkara dan kecelakaan laut</small></span><ArrowRight size={15} /></button>}<button onClick={() => navigate('reports')}><ClipboardCheck size={19} /><span><b>Laporan kasus</b><small>Rekap dan ekspor CSV</small></span><ArrowRight size={15} /></button>{!external && <button onClick={() => navigate('flow')}><Compass size={19} /><span><b>Alur kerja SIRATSI</b><small>Tahapan respons dan evaluasi</small></span><ArrowRight size={15} /></button>}</div></section></div>
  <section className="panel partner-panel"><div className="section-bar"><h2>Stakeholder Terintegrasi</h2></div><div className="partner-list"><span><Anchor size={23} /><b>Ditpolairud Polda Lampung</b></span>{externalOrganizations.map((org) => <span key={org}><ShieldCheck size={23} /><b>{org}</b></span>)}</div></section></>}
  {view === 'stage' && canAccessPage(access, 'stage', stageFilter) && <><div className="head"><div><h1>{stages[stageFilter]}</h1><p>Pilih informasi untuk melihat dan mengerjakan tahapan penanganan.</p></div>{canAccessPage(access, 'flow') && <button className="secondary" onClick={() => navigate('flow')}><Compass size={17} /> Lihat alur kerja</button>}</div><div className="stage-summary"><span className="stat-icon"><Activity size={22} /></span><div><strong>{items.filter((x) => x.stage === stageFilter).length} informasi pada tahap ini</strong><small>Kasus yang telah melewati tahap ini dapat dibuka melalui Daftar Informasi.</small></div></div><section className="panel"><div className="section-bar"><h2>Daftar {stages[stageFilter]}</h2></div>{items.filter((x) => x.stage === stageFilter).length ? list(items.filter((x) => x.stage === stageFilter)) : <div className="chart-empty">Belum ada informasi yang menunggu pada tahap ini.</div>}</section></>}
  {view === 'notifications' && <><div className="head"><div><h1>Notifikasi</h1><p>Perubahan terbaru pada informasi yang dapat Anda akses.</p></div></div><section className="panel"><div className="section-bar"><h2>Aktivitas Kasus</h2></div>{items.length ? <div className="notification-list full">{[...items].sort((a,b) => b.updated_at.localeCompare(a.updated_at)).map((x) => <button key={x.id} className={unreadIds.includes(x.id) ? 'unread' : ''} onClick={() => open(x)}><span className={`notice-icon ${x.stage === 7 ? 'done' : ['Tinggi','Kritis'].includes(x.priority) ? 'urgent' : ''}`}><Bell size={18} /></span><span><b>{unreadIds.includes(x.id) && <i className="unread-dot" aria-label="Belum dibaca" />} {x.id} · {x.category}</b><small>{stageName(x.stage)} · {x.location} · Prioritas {x.priority}</small></span><time>{date(x.updated_at)}</time></button>)}</div> : <div className="chart-empty">Belum ada aktivitas kasus.</div>}</section></>}
  {view === 'new' && <><div className="head"><div><h1>Terima Informasi</h1><p>Catat laporan awal untuk memulai alur penanganan.</p></div></div><div className="form-intro"><span><Ship size={24} /></span><div><b>Laporan dari lapangan</b><small>Lengkapi lima informasi utama. Nomor kasus dibuat otomatis setelah disimpan.</small></div></div><section className="panel" style={{ maxWidth: 940 }}><h2>Informasi pelapor dan kejadian</h2><form onSubmit={create}><div className="grid-fields"><div className="field"><label htmlFor="reporter">Nama pelapor *</label><input required id="reporter" value={form.reporter} onChange={(e) => setForm({ ...form, reporter: e.target.value })} /></div><div className="field"><label htmlFor="contact">Nomor kontak *</label><input required id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div><div className="field"><label htmlFor="category">Jenis kejadian *</label><select required id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Pilih jenis kejadian</option>{['Illegal fishing', 'Pencemaran laut', 'Kecelakaan laut', 'Penyelundupan', 'Gangguan keamanan', 'Lainnya'].map((x) => <option key={x}>{x}</option>)}</select></div><div className="field"><label htmlFor="location">Lokasi kejadian *</label><input required id="location" placeholder="Contoh: Perairan Teluk Lampung" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div></div><div className="field"><label htmlFor="description">Uraian kejadian *</label><textarea required id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div className="actions"><button type="button" className="secondary" onClick={() => setView('dashboard')}>Batal</button><button className="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan informasi'} <ArrowRight size={17} /></button></div></form></section></>}
  {view === 'cases' && <><div className="head"><div><h1>Daftar Informasi</h1><p>Telusuri kasus dan lanjutkan tahapan penanganan.</p></div>{!external && <button className="primary" onClick={() => setView('new')}><FilePlus2 size={17} /> Input informasi</button>}</div><section className="panel"><div className="filters"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor, lokasi, pelapor..." aria-label="Cari informasi" /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter status"><option>Semua status</option><option>Aktif</option><option>Selesai</option><option>Tinggi</option><option>Kritis</option></select></div>{loading ? <div className="empty">Memuat data...</div> : list(filtered)}</section></>}
  {view === 'detail' && incident && <><div className="head"><div><button className="secondary no-print" onClick={() => setView('cases')} style={{ marginBottom: 13 }}><ArrowLeft size={16} /> Daftar informasi</button><h1>{incident.id}</h1><div className="detail-meta"><span>{incident.category}</span><span>·</span><span>{incident.location}</span><span>·</span>{badge(incident)}<span className={`badge ${['Tinggi','Kritis'].includes(incident.priority) ? 'high' : ''}`}>Prioritas {incident.priority}</span></div></div><button className="secondary no-print" onClick={() => window.print()}><Printer size={17} /> Cetak ringkasan</button></div><section className="panel"><h2>Informasi awal</h2><div className="grid-fields"><div><strong>Pelapor</strong><p>{incident.reporter} · {incident.contact}</p></div><div><strong>Tanggal dicatat</strong><p>{date(incident.created_at)}</p></div></div><strong>Uraian kejadian</strong><p>{incident.description}</p></section><div className="steps no-print" aria-label="Tahapan penanganan">{stages.map((s, i) => <button type="button" key={s} className={`step ${i < incident.stage ? 'complete' : i === incident.stage ? 'current' : ''} ${i <= incident.stage ? 'reviewable' : ''} ${reviewStage === i ? 'reviewing' : ''}`} disabled={i > incident.stage} onClick={() => setReviewStage(i < incident.stage ? i : null)}><b>{i + 1}. {s}</b><span>{i < incident.stage || incident.stage === 7 ? 'Tercatat' : i === incident.stage ? 'Sedang dikerjakan' : 'Menunggu'}</span></button>)}</div>{reviewStage !== null && reviewStage < incident.stage && <section className="panel stage-review"><div className="section-bar"><div><h2>{reviewStage + 1}. {stages[reviewStage]}</h2><p>Data tercatat pada tahap ini. Tampilan hanya untuk peninjauan.</p></div><button type="button" className="secondary" onClick={() => setReviewStage(null)}>Kembali ke tahap aktif</button></div><div className="review-fields">{forms[reviewStage].filter((field) => field.kind !== 'heading' && field.kind !== 'upload' && field.kind !== 'execution-upload' && field.kind !== 'evaluation-context').map((field) => <div key={field.key}><b>{field.label}</b><span>{String(incident.data[field.key] ?? 'Belum diisi')}</span></div>)}</div>{reviewStage === 2 && <section className="stage-review-extra"><h3>Pembagian peran stakeholder</h3>{readStakeholderRows(incident.data.stakeholderRoles).length ? <div className="review-assignment-list">{readStakeholderRows(incident.data.stakeholderRoles).map((row, index) => <div key={`${row.kind}:${row.name}:${index}`}><b>{row.name}</b><span>{row.kind === 'internal' ? 'Internal' : 'Eksternal'} � {row.role}</span><p>{row.task}</p><small>PIC: {row.pic} | Batas waktu: {row.due}</small></div>)}</div> : <p>Belum ada pembagian peran yang tercatat.</p>}</section>}{reviewStage === 3 && <section className="stage-review-extra"><h3>Rencana respons dan persetujuan</h3><div className="review-fields"><div><b>Jenis respons</b><span>{String(incident.data.responseType || 'Belum diisi')}</span></div><div><b>Tingkat urgensi</b><span>{String(incident.data.urgency || 'Belum diisi')}</span></div><div><b>Tujuan respons</b><span>{String(incident.data.responseGoal || 'Belum diisi')}</span></div><div><b>Waktu dan durasi</b><span>{String(incident.data.targetDate || 'Belum diisi')} | {String(incident.data.durationHours || '-')} jam</span></div><div><b>Rencana tindakan</b><span>{String(incident.data.responsePlan || 'Belum diisi')}</span></div><div><b>Sumber daya</b><span>{String(incident.data.resources || 'Belum diisi')}</span></div><div><b>Pimpinan tujuan</b><span>{String(incident.data.approver || 'Belum diajukan')}</span></div><div><b>Status persetujuan</b><span>{String(incident.data.approvalStatus || 'Belum diajukan')}</span></div></div></section>}{reviewStage === 0 && <section className="stage-review-evidence"><h3>Bukti pendukung yang diunggah</h3>{verificationEvidence.length ? <div className="evidence-preview-grid">{verificationEvidence.map((file) => { const url = `/api/incidents/${encodeURIComponent(incident.id)}/verification-evidence/${file.id}`; return <a className="evidence-preview" key={file.id} href={url} target="_blank" rel="noopener noreferrer">{file.contentType.startsWith('image/') ? <img src={url} alt={file.filename} loading="lazy" /> : <span className="pdf-preview"><FileText size={31} />{file.contentType === 'application/pdf' ? 'PDF' : 'Berkas'}</span>}<b>{file.filename}</b><small>{Math.ceil(file.sizeBytes / 1024)} KB � {date(file.createdAt)}</small></a>; })}</div> : <p>Belum ada bukti pendukung yang diunggah pada tahap verifikasi.</p>}</section>}</section>}{!external && reviewStage === null && (incident.stage < 7 ? <section className="panel"><h2>{incident.stage + 1}. {stages[incident.stage]}</h2>{incident.stage !== 3 && <div className="stage-box">Isi data tahap ini. Simpan draf untuk melanjutkan nanti, atau lanjutkan ke tahap berikutnya setelah kolom wajib lengkap.</div>}<div className="grid-fields">{forms[incident.stage]?.map(field)}</div>{incident.stage === 3 && <ResponseApprovalForm incident={incident} draft={draft} setDraft={setDraft} approvers={approvers} approval={approval} documents={approvalDocuments} currentUserId={access.id} isAdmin={access.role === 'super_admin'} canEdit={['super_admin', 'internal_receiver'].includes(access.role)} saving={saving} uploading={uploadingApproval} onUpload={uploadApprovalDocuments} onDraft={() => save(false)} onSubmit={submitApproval} onDecision={decideApproval} />}{incident.stage === 2 && <StakeholderForm incident={incident} draft={draft} setDraft={setDraft} documents={stakeholderDocuments} uploading={uploadingDocuments} onUpload={uploadStakeholderDocuments} />}{incident.stage === 1 && <div className="location-picker"><div className="location-picker-head"><div><h3><MapPin size={19} /> Pilih titik lokasi di peta</h3><p>Geser dan perbesar peta, lalu ketuk titik yang diperkirakan. Koordinat di atas terisi otomatis; simpan untuk menampilkannya di dashboard.</p></div><span className="badge">{parseCoordinates(draft.coordinates) ? formatCoordinates(parseCoordinates(draft.coordinates)!) : 'Belum ada titik'}</span></div><InteractiveMap value={parseCoordinates(draft.coordinates)} markers={recordedPoints.filter((x) => x.id !== incident.id)} onSelect={selectLocation} ariaLabel="Peta interaktif untuk memilih lokasi prioritas" /></div>}{incident.stage === 6 && <div className="evidence-panel"><div className="evidence-heading"><span className="evidence-icon"><Camera size={23} /></span><div><h3>Bukti dukung & dokumentasi foto *</h3><p>Unggah minimal satu foto sebelum menyelesaikan kasus. JPG, PNG, atau WebP; maksimal 5 MB per foto dan 8 foto per kasus.</p></div></div><label className="upload-control" htmlFor="evidence-upload"><ImagePlus size={21} /><span>{uploading ? 'Mengunggah foto...' : 'Pilih foto atau ambil dari galeri'}</span></label><input className="visually-hidden" id="evidence-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || evidence.length >= 8} onChange={uploadEvidence} />{evidence.length > 0 && <div className="evidence-grid">{evidence.map((photo) => <a key={photo.id} className="evidence-photo" href={`/api/incidents/${encodeURIComponent(incident.id)}/evidence/${photo.id}`} target="_blank" rel="noopener noreferrer"><img src={`/api/incidents/${encodeURIComponent(incident.id)}/evidence/${photo.id}`} alt={`Dokumentasi ${photo.filename}`} loading="lazy" /><span>{photo.filename}</span></a>)}</div>}</div>}{incident.stage !== 3 && <div className="actions"><button className="secondary" onClick={() => save(false)} disabled={saving}>Simpan draf</button><button className="primary" onClick={() => save(true)} disabled={saving}>{saving ? 'Menyimpan...' : incident.stage === 6 ? 'Selesaikan kasus' : 'Simpan & lanjutkan'} <ArrowRight size={17} /></button></div>}</section> : <section className="panel"><h2><CheckCircle2 size={22} style={{ display: 'inline', verticalAlign: 'middle', color: '#188759' }} /> Penanganan selesai</h2><p>Seluruh tahapan telah dicatat. Data tersedia pada laporan dan dapat dicetak sebagai ringkasan.</p><button className="secondary" onClick={() => setView('reports')}>Buka laporan</button></section>)}{incident.stage === 7 && <section className="panel"><h2><Camera size={21} className="inline-icon" /> Dokumentasi penyelesaian</h2>{evidence.length ? <div className="evidence-grid">{evidence.map((photo) => <a key={photo.id} className="evidence-photo" href={`/api/incidents/${encodeURIComponent(incident.id)}/evidence/${photo.id}`} target="_blank" rel="noopener noreferrer"><img src={`/api/incidents/${encodeURIComponent(incident.id)}/evidence/${photo.id}`} alt={`Dokumentasi ${photo.filename}`} loading="lazy" /><span>{photo.filename}</span></a>)}</div> : <p>Belum ada foto dokumentasi.</p>}</section>}{incident.stage >= 4 && <ApprovalSummary approval={approval} />}{incident.stage >= 3 && <StakeholderSummary incidentId={incident.id} rows={readStakeholderRows(incident.data.stakeholderRoles)} documents={stakeholderDocuments} />}{!external && incident.stage !== 2 && !readStakeholderRows(incident.data.stakeholderRoles).length && <section className="panel"><h2>Penugasan stakeholder eksternal</h2><p>Pilih instansi yang boleh melihat kasus ini dan mengirim catatan tindak lanjut.</p><div className="assignment-options">{externalOrganizations.map((org) => <label key={org} className="check-row"><input type="checkbox" checked={assignments.includes(org)} onChange={(e) => setAssignments(e.target.checked ? [...assignments, org] : assignments.filter((x) => x !== org))} />{org}</label>)}</div><div className="actions"><button className="primary" disabled={saving} onClick={saveAssignments}>Simpan penugasan</button></div></section>}{external && <section className="panel"><h2>Penugasan {access.organization}</h2><p>Kasus ini ditugaskan kepada instansi Anda. Sampaikan perkembangan melalui catatan di bawah.</p><form onSubmit={sendUpdate}><div className="field"><label htmlFor="external-note">Catatan tindak lanjut</label><textarea id="external-note" maxLength={1000} required value={updateNote} onChange={(e) => setUpdateNote(e.target.value)} placeholder="Uraikan perkembangan atau hasil koordinasi..." /></div><div className="actions"><button className="primary" disabled={saving}>Kirim catatan</button></div></form></section>}<section className="panel"><h2>Catatan stakeholder</h2>{updates.length ? <div className="list">{updates.map((u, i) => <div className="flow-item" key={i}><b>{u.organization} · {date(u.created_at)}</b><small>{u.note}</small></div>)}</div> : <p>Belum ada catatan dari stakeholder eksternal.</p>}</section><section className="panel"><h2>Riwayat data penanganan</h2><div className="flow">{forms.slice(0, Math.min(incident.stage + 1, 7)).map((fields, index) => <div className="flow-item" key={index}><b>{index + 1}. {stages[index]}</b>{fields.filter((f) => incident.data[f.key] !== undefined && incident.data[f.key] !== '').slice(0, 3).map((f) => <small key={f.key}>{f.label}: {String(incident.data[f.key] === true ? 'Ya' : incident.data[f.key] === false ? 'Tidak' : incident.data[f.key]).slice(0, 90)}</small>)}</div>)}</div></section></>}
  {view === 'map' && <><div className="head"><div><h1>Peta & Pangkalan Kapal</h1><p>Referensi titik rawan illegal fishing dan sebaran pangkalan Ditpolairud Polda Lampung.</p></div></div><div className="stats"><div className="stat"><span className="stat-icon"><MapPin /></span><div><strong>13</strong><span>Titik rawan referensi</span></div></div><div className="stat"><span className="stat-icon"><Waves /></span><div><strong>14</strong><span>Pangkalan kapal</span></div></div><div className="stat"><span className="stat-icon"><ShieldCheck /></span><div><strong>25</strong><span>Kapal (C2 9 · C3 11 · RIB 5)</span></div></div><div className="stat"><span className="stat-icon"><Users /></span><div><strong>89</strong><span>Personel kapal</span></div></div></div><section className="panel live-map-panel"><div className="panel-head"><div><h2>Peta titik prioritas tercatat</h2><p>Penanda berasal dari koordinat kasus yang disimpan petugas. Ketuk penanda untuk membuka kasus.</p></div><span className="badge">{recordedPoints.length} titik</span></div><InteractiveMap markers={recordedPoints} autoFit onMarkerClick={(id) => { const chosen = items.find((x) => x.id === id); if (chosen) open(chosen); }} ariaLabel="Peta titik lokasi prioritas tercatat" /><div className="map-analysis"><div><b>{recordedPoints.length}</b><small>Titik tercatat</small></div><div><b>{recordedPoints.filter((x) => ['Tinggi','Kritis'].includes(x.priority || '')).length}</b><small>Prioritas tinggi / kritis</small></div><div><b>{hotSpots.filter((x) => x.cases.length >= 2).length}</b><small>Konsentrasi ≥2 kasus dalam 10 km</small></div></div>{hotSpots.filter((x) => x.cases.length >= 2).length > 0 && <div className="hotspot-list"><h3>Wilayah dengan kasus berdekatan</h3>{hotSpots.filter((x) => x.cases.length >= 2).slice(0, 5).map((group, index) => <div key={index}><span><MapPin size={16} /> {formatCoordinates(group)} · {group.cases.length} kasus</span><a href={googleMapsUrl(group)} target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div>)}</div>}<p className="source-note">Kelompok dihitung dari jarak antar titik tercatat, radius sekitar 10 km; ini indikator konsentrasi laporan, bukan penetapan resmi zona rawan. Peta referensi sumber tersedia di bawah.</p></section><div className="dashboard-grid"><section className="panel"><h2>Peta 13 titik rawan</h2><img className="reference-image" src="/reference/peta-titik-rawan.png" alt="Peta referensi 13 titik rawan illegal fishing perairan Lampung beserta legenda" /><p className="source-note">Sumber: peta yang dilampirkan. Posisi penanda bersifat visual dan belum menggunakan koordinat GIS; penetapan operasi harus merujuk data dinas terbaru.</p></section><section className="panel"><h2>Daftar titik rawan</h2><div className="risk-list">{riskPoints.map((p, i) => <button key={p.name} className={mapSelection === i ? 'selected' : ''} onClick={() => setMapSelection(i)}><span className={`risk-number ${p.level === 'multi' ? 'multi' : ''}`}>{i + 1}</span><span><b>{p.name}</b><small>{p.level === 'multi' ? 'Lebih dari satu modus' : 'Satu modus'}</small></span></button>)}</div>{mapSelection !== null && <p className="stage-box"><b>Titik {mapSelection + 1}: {riskPoints[mapSelection].name}.</b> {riskPoints[mapSelection].level === 'multi' ? 'Lebih dari satu modus pada peta sumber.' : 'Satu modus pada peta sumber.'} Penanda nomor yang sama terlihat pada peta referensi.</p>}</section></div><div className="dashboard-grid"><section className="panel"><h2>14 pangkalan kapal</h2><div className="base-grid">{bases.map((b) => <div key={b.name} className="base-tile"><b>{b.name}</b><span>{b.ships} kapal</span></div>)}</div><p className="source-note">Jumlah pada tiap pangkalan mengikuti infografis yang dilampirkan. Angka ini adalah inventaris referensi, bukan status kapal siap operasi saat ini.</p></section><section className="panel"><h2>Komposisi armada & personel</h2><img className="reference-image" src="/reference/pangkalan-kapal.png" alt="Infografis sumber data Subdit Patroli: 25 kapal pada 14 pangkalan dan 89 personel" /><p className="source-note">Sumber: infografis Data Subdit Patroli Ditpolairud Polda Lampung yang dilampirkan. 25 komandan kapal dan 64 ABK.</p></section></div></>}
  {view === 'historical' && <><div className="head"><div><h1>Data Historis</h1><p>Rekap sumber yang dilampirkan untuk mendukung perencanaan dan evaluasi.</p></div></div><section className="panel"><h2>Perkara terkait illegal fishing dan bahan peledak, 2021–2025</h2><div className="table-wrap"><Table className="table"><TableHeader><TableRow><TableHead>Tahun dokumen</TableHead><TableHead>Illegal fishing / bom ikan / setrum</TableHead><TableHead>Penyalahgunaan bahan peledak / handak</TableHead><TableHead>Lainnya</TableHead><TableHead>Total baris perkara</TableHead></TableRow></TableHeader><TableBody>{historicalCases.map((x) => <TableRow key={x.year}><TableCell><b>{x.year}</b></TableCell><TableCell>{x.fishing}</TableCell><TableCell>{x.explosive}</TableCell><TableCell>{x.other}</TableCell><TableCell><b>{x.fishing + x.explosive + x.other}</b></TableCell></TableRow>)}</TableBody></Table></div><p className="source-note">Sumber: lima dokumen “DATA KASUS TAHUN 2021–2025 TUGAS ILEGAL FISHING”. Angka adalah hitungan baris perkara menurut judul tahun dokumen, bukan verifikasi tahun kejadian. Dokumen 2024 memuat beberapa nomor LP bertahun 2023; klasifikasi mengikuti kolom jenis kasus. Identitas individu tidak dimuat di tampilan ini.</p></section><div className="dashboard-grid"><section className="panel"><h2>Kecelakaan laut, 2023–2025</h2><div className="stats compact-stats">{[2023,2024,2025].map((year) => <div className="stat" key={year}><div><strong>{accidents.filter((x) => x.year === year).length}</strong><span>Kejadian {year}</span></div></div>)}</div><div className="table-wrap"><Table className="table"><TableHeader><TableRow><TableHead>Tahun</TableHead><TableHead>Jenis</TableHead><TableHead>Waktu / tempat dalam sumber</TableHead><TableHead>Dampak tercatat</TableHead></TableRow></TableHeader><TableBody>{accidents.map((x, i) => <TableRow key={`${x.year}-${i}`}><TableCell>{x.year}</TableCell><TableCell>{x.type}</TableCell><TableCell>{x.placeTime}</TableCell><TableCell>{x.impact}</TableCell></TableRow>)}</TableBody></Table></div><p className="source-note">Sumber: Data_Laka_Laut_2023.xlsx, Data_Laka_Laut_2024.xlsx, dan Data_Laka_Laut_2025.xlsx. Narasi kejadian dan angka kerugian Rupiah tidak diasumsikan dari kolom dampak.</p></section><section className="panel"><h2>Pemberdayaan masyarakat</h2><div className="stats compact-stats"><div className="stat"><div><strong>{community.inhabitedIslands.length}</strong><span>Pulau berpenghuni tercantum</span></div></div><div className="stat"><div><strong>{community.developedIslands.length}</strong><span>Pulau sudah dibina</span></div></div><div className="stat"><div><strong>{community.groups}</strong><span>Kelompok dibina</span></div></div></div><h3>Pulau yang sudah dibina</h3><div className="base-grid">{community.developedIslands.map((name) => <div className="base-tile" key={name}><b>{name}</b></div>)}</div><p className="source-note">Sumber: data pemberdayaan masyarakat.xlsx. Nama pulau dan jumlah kelompok mengikuti isian sumber.</p></section></div></>}
  {view === 'profile' && <><div className="head"><div><h1>Edit Profil</h1><p>Perbarui identitas yang digunakan pada header dan aktivitas SIRATSI.</p></div></div><section className="panel profile-page"><form onSubmit={saveProfile}><div className="profile-photo-editor"><div className="profile-photo-large">{profilePhotoPreview ? <img src={profilePhotoPreview} alt="Foto profil" /> : <UserRound size={42} />}</div><div><b>Foto profil</b><small>JPG, PNG, atau WebP. Maksimal 2 MB.</small><label className="secondary profile-photo-upload" htmlFor="profile-photo">Pilih foto</label><input id="profile-photo" className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadProfilePhoto} /></div></div><div className="field"><label htmlFor="profile-name">Nama tampilan *</label><input id="profile-name" required maxLength={150} value={profileName} onChange={(event) => setProfileName(event.target.value)} /></div><div className="field"><label htmlFor="profile-job-title">Jabatan</label><input id="profile-job-title" maxLength={150} value={profileJobTitle} onChange={(event) => setProfileJobTitle(event.target.value)} placeholder="Contoh: Kepala Satuan Polairud" /></div><div className="profile-readonly"><div><b>Email akun</b><span>{access.email}</span></div><div><b>Instansi</b><span>{access.organization}</span></div><div><b>Peran</b><span>{access.role === 'super_admin' ? 'Super Admin' : access.role === 'internal_receiver' ? 'Penerima informasi internal' : access.role === 'leader_approver' ? 'Pimpinan pemberi persetujuan' : access.role === 'response_executor' ? 'Pelaksana respons' : 'Stakeholder eksternal'}</span></div></div><div className="actions"><button type="button" className="secondary" onClick={() => navigate('dashboard')}>Batal</button><button className="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan profil'}</button></div></form></section></>}
  {view === 'users' && access.role === 'super_admin' && <><div className="head"><div><h1>Pengguna & Hak Akses</h1><p>Daftarkan email petugas internal dan stakeholder eksternal.</p></div></div><div className="dashboard-grid"><section className="panel"><h2>Tambahkan pengguna</h2><form onSubmit={addUser}><div className="field"><label htmlFor="user-name">Nama *</label><input id="user-name" required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></div><div className="field"><label htmlFor="user-email">Email akun ChatGPT *</label><input id="user-email" type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div><div className="field"><label htmlFor="user-password">Kata sandi awal * (minimal 12 karakter)</label><input id="user-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div><div className="field"><label htmlFor="user-role">Peran *</label><select id="user-role" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}><option value="internal_receiver">Penerima informasi internal</option><option value="leader_approver">Pimpinan pemberi persetujuan</option><option value="external_stakeholder">Stakeholder eksternal</option></select></div>{userForm.role === 'external_stakeholder' && <div className="field"><label htmlFor="user-org">Instansi *</label><select id="user-org" value={userForm.organization} onChange={(e) => setUserForm({ ...userForm, organization: e.target.value })}>{externalOrganizations.map((org) => <option key={org}>{org}</option>)}</select></div>}<div className="actions"><button className="primary" disabled={saving}>Tambah pengguna</button></div></form><p className="source-note">Berikan kata sandi awal kepada pengguna melalui saluran yang aman. Tidak ada undangan yang dikirim otomatis.</p></section><section className="panel"><h2>Daftar pengguna</h2>{users.length ? <div className="list">{users.map((u) => <div className="user-row" key={u.id}><div><b>{u.name}</b><small>{u.email}<br />{u.role === 'super_admin' ? 'Super Admin' : u.role === 'internal_receiver' ? 'Penerima informasi internal' : u.role === 'leader_approver' ? 'Pimpinan pemberi persetujuan' : `Stakeholder ${u.organization}`}</small></div><span className={`badge ${u.active ? 'done' : 'alert'}`}>{u.active ? 'Aktif' : 'Nonaktif'}</span><UserEditButton user={u} onSaved={loadUsers} /><button className="secondary" onClick={() => { setPasswordTarget(u.id); setNewPassword(''); }}>{u.has_password ? 'Atur ulang sandi' : 'Atur sandi'}</button>{u.role !== 'super_admin' && <button className="secondary" onClick={() => toggleUser(u)}>{u.active ? 'Nonaktifkan' : 'Aktifkan'}</button>}</div>)}</div> : <div className="empty">Belum ada pengguna tambahan.</div>}{passwordTarget && <div className="password-panel"><h3>Atur kata sandi {users.find((u) => u.id === passwordTarget)?.name}</h3><label htmlFor="reset-password">Kata sandi baru (minimal 12 karakter)</label><input id="reset-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /><div className="actions"><button className="secondary" onClick={() => { setPasswordTarget(null); setNewPassword(''); }}>Batal</button><button className="primary" disabled={saving} onClick={() => updatePassword(passwordTarget)}>Simpan kata sandi</button></div></div>}</section></div></>}
  {view === 'flow' && <><div className="head"><div><h1>Alur Kerja SIRATSI</h1><p>Urutan pencatatan, koordinasi, pelaksanaan, dan evaluasi.</p></div></div><section className="panel"><div className="flow">{stages.map((s, i) => <div className="flow-item" key={s}><b>{i === 7 ? '✓' : String(i + 1).padStart(2, '0')} · {s}</b><small>{['Pemeriksaan kelengkapan dan validitas','Penetapan lokasi dan tingkat risiko','Pembagian tugas internal dan eksternal','Rencana respons serta persetujuan pimpinan','Pelaksanaan tindakan dan dokumentasi','Pemantauan progres dan eskalasi','Penilaian hasil, kerugian negara, peta, dan SOP','Dokumentasi penutupan kasus'][i]}</small></div>)}</div></section></>}
  {view === 'reports' && <><div className="print-head"><h1>Laporan SIRATSI</h1><p>Ditpolairud Polda Lampung · Dicetak {date(new Date().toISOString())}</p></div><div className="head"><div><h1>Laporan</h1><p>Rekap informasi, status penanganan, dan perkiraan kerugian negara.</p></div><div className="actions no-print"><button className="secondary" onClick={csv}><Download size={17} /> Ekspor CSV</button><button className="primary" onClick={() => window.print()}><Printer size={17} /> Cetak / PDF</button></div></div><div className="stats"><div className="stat"><span className="stat-icon"><FileText /></span><div><strong>{filtered.length}</strong><span>Informasi ditampilkan</span></div></div><div className="stat"><span className="stat-icon"><ShieldCheck /></span><div><strong>{completed}</strong><span>Kasus selesai</span></div></div><div className="stat"><span className="stat-icon"><MapPin /></span><div><strong>{new Set(items.map((x) => x.location)).size}</strong><span>Lokasi tercatat</span></div></div><div className="stat"><span className="stat-icon"><Users /></span><div><strong style={{ fontSize: 18 }}>{money(loss)}</strong><span>Perkiraan kerugian negara</span></div></div></div><section className="panel"><div className="filters no-print"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari laporan..." aria-label="Cari laporan" /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter laporan"><option>Semua status</option><option>Aktif</option><option>Selesai</option><option>Tinggi</option><option>Kritis</option></select></div><div className="table-wrap"><Table className="table"><TableHeader><TableRow>{['Nomor / tanggal','Kejadian','Lokasi','Tahap','Prioritas','Kerugian negara','Detail'].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{filtered.map((x) => <TableRow key={x.id}><TableCell><strong>{x.id}</strong><br />{date(x.created_at)}</TableCell><TableCell>{x.category}</TableCell><TableCell>{x.location}</TableCell><TableCell>{stageName(x.stage)}</TableCell><TableCell>{x.priority}</TableCell><TableCell>{money(Number(x.data.lossAmount) || 0)}</TableCell><TableCell><button className="no-print" onClick={() => open(x)}>Lihat</button></TableCell></TableRow>)}</TableBody></Table></div>{!filtered.length && <div className="empty">Belum ada data sesuai pencarian.</div>}</section></>}
  </div></main><nav className="mobile-bottom-nav no-print" aria-label="Navigasi ponsel"><button className={view === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard size={21} /><span>Beranda</span></button><button className={view === 'new' ? 'active' : ''} onClick={() => navigate(external ? 'cases' : 'new')}><FilePlus2 size={21} /><span>{external ? 'Kasus' : 'Input'}</span></button><button className={view === 'map' ? 'active' : ''} onClick={() => navigate(external ? 'reports' : 'map')}><MapPin size={21} /><span>{external ? 'Rekap' : 'Peta'}</span></button><button className={view === 'reports' ? 'active' : ''} onClick={() => navigate('reports')}><BarChart3 size={21} /><span>Laporan</span></button><button className={['cases','detail','historical','flow','stage','notifications','users'].includes(view) ? 'active' : ''} onClick={() => setMobileMenu(true)}><Menu size={21} /><span>Menu</span></button></nav><Sheet open={mobileMenu} onOpenChange={setMobileMenu}><SheetContent side="bottom" className="mobile-nav-sheet"><SheetHeader><SheetTitle>Menu SIRATSI</SheetTitle><SheetDescription>Pilih halaman yang ingin dibuka.</SheetDescription></SheetHeader><div className="mobile-sheet-links">{nav.map((n) => <button key={`${n.key}-${n.stage ?? ''}`} onClick={() => goToMenu(n)}>{n.icon}<span>{n.label}</span><ChevronRight size={17} /></button>)}<a className="mobile-signout" href="/api/auth/logout" target="_top">Keluar akun</a></div></SheetContent></Sheet>{message && <div className="toast" role="status">{message}</div>}</div>;
}
