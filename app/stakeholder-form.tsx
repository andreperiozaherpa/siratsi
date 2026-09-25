'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, FileUp, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { readStakeholderRows, stakeholderRoles, type StakeholderRow } from './stakeholder-data';
import { AuditTrail } from './workflow-panels';

type Case = { id: string; created_at: string; category: string; description: string; location: string; priority: string; data: Record<string, string | boolean> };
type DirectoryEntry = { id: string; name: string; kind: 'internal' | 'external'; detail: string; active: number };
type DirectoryResponse = { entries: DirectoryEntry[]; canManage: boolean; error?: string };
export type StakeholderDocument = { id: string; filename: string; contentType: string; sizeBytes: number; createdAt: string };

export function StakeholderForm({ incident, draft, setDraft, documents, uploading, onUpload }: { incident: Case; draft: Record<string, string | boolean>; setDraft: React.Dispatch<React.SetStateAction<Record<string, string | boolean>>>; documents: StakeholderDocument[]; uploading: boolean; onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'internal' | 'external'>('internal');
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [directoryError, setDirectoryError] = useState('');
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directorySaving, setDirectorySaving] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', kind: 'internal' as 'internal' | 'external', detail: '' });

  const loadDirectory = async () => {
    setDirectoryLoading(true);
    try {
      const response = await fetch('/api/stakeholders?includeInactive=1', { cache: 'no-store' });
      const result = await response.json() as DirectoryResponse;
      if (!response.ok) throw new Error(result.error || 'Master stakeholder tidak dapat dimuat.');
      setDirectory(result.entries);
      setCanManage(result.canManage);
      setDirectoryError('');
    } catch (error) { setDirectoryError(error instanceof Error ? error.message : 'Master stakeholder tidak dapat dimuat.'); }
    finally { setDirectoryLoading(false); }
  };

  useEffect(() => { void loadDirectory(); }, []);

  const storedRows = readStakeholderRows(draft.stakeholderRoles);
  const activeDirectory = directory.filter((entry) => entry.active);
  const internalEntries = activeDirectory.filter((entry) => entry.kind === 'internal');
  const externalEntries = activeDirectory.filter((entry) => entry.kind === 'external');
  const legacyInternal = String(draft.leadUnit || '');
  const legacyExternal = String(draft.externalStakeholders || '').split(',').map((name) => name.trim()).filter((name) => externalEntries.some((entry) => entry.name === name));
  const rows = storedRows.length ? storedRows : [
    ...(internalEntries.some((entry) => entry.name === legacyInternal) ? [{ name: legacyInternal, kind: 'internal' as const, role: 'Koordinator', task: String(draft.roleDivision || ''), pic: String(draft.coordinationContact || ''), due: '' }] : []),
    ...legacyExternal.map((name) => ({ name, kind: 'external' as const, role: 'Pelaksana', task: '', pic: '', due: '' })),
  ];
  const persist = (next: StakeholderRow[]) => setDraft((old) => ({ ...old, stakeholderRoles: JSON.stringify(next) }));
  const toggle = (name: string, kind: StakeholderRow['kind']) => {
    if (rows.some((row) => row.name === name && row.kind === kind)) persist(rows.filter((row) => row.name !== name || row.kind !== kind));
    else persist([...rows, { name, kind, role: kind === 'internal' && !rows.some((row) => row.kind === 'internal' && row.role === 'Koordinator') ? 'Koordinator' : 'Pelaksana', task: '', pic: '', due: '' }]);
  };
  const update = (name: string, kind: StakeholderRow['kind'], key: 'role' | 'task' | 'pic' | 'due', value: string) => persist(rows.map((row) => row.name === name && row.kind === kind ? { ...row, [key]: value } : row));
  const query = search.trim().toLowerCase();
  const entries = tab === 'internal' ? internalEntries : externalEntries;

  const addDirectoryEntry = async (event: React.FormEvent) => {
    event.preventDefault(); setDirectorySaving(true); setDirectoryError('');
    try {
      const response = await fetch('/api/stakeholders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEntry) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Stakeholder belum tersimpan.');
      setNewEntry({ name: '', kind: tab, detail: '' }); setTab(newEntry.kind); await loadDirectory();
    } catch (error) { setDirectoryError(error instanceof Error ? error.message : 'Stakeholder belum tersimpan.'); }
    finally { setDirectorySaving(false); }
  };

  const setDirectoryActive = async (entry: DirectoryEntry, active: boolean) => {
    setDirectorySaving(true); setDirectoryError('');
    try {
      const response = await fetch(`/api/stakeholders/${encodeURIComponent(entry.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Status stakeholder belum diperbarui.');
      if (!active) persist(rows.filter((row) => row.name !== entry.name || row.kind !== entry.kind));
      await loadDirectory();
    } catch (error) { setDirectoryError(error instanceof Error ? error.message : 'Status stakeholder belum diperbarui.'); }
    finally { setDirectorySaving(false); }
  };

  return <div className="stakeholder-form">
    <div className="stakeholder-heading"><span><Users size={23} /></span><div><h3>Bagi Peran Stakeholder</h3><p>Tetapkan unit, tugas, penanggung jawab, dan batas waktu untuk kasus ini.</p></div></div>
    <div className="stakeholder-columns"><div className="stakeholder-main">
      <section className="stake-section"><h4>A. Informasi Kejadian</h4><div className="stake-summary"><div><b>ID informasi</b><span>{incident.id}</span></div><div><b>Jenis kejadian</b><span>{incident.category}</span></div><div><b>Lokasi prioritas</b><span>{String(draft.priorityArea || incident.data.priorityArea || incident.location)}</span></div><div><b>Tingkat prioritas</b><span>{incident.priority}</span></div><div><b>Tanggal dicatat</b><span>{new Date(incident.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span></div><div><b>Uraian</b><span>{incident.description}</span></div></div></section>
      <section className="stake-section"><h4>C. Tetapkan Peran dan Tugas</h4><p className="stake-hint">Pilih unit atau instansi di bagian B. Tetapkan satu koordinator internal, lalu lengkapi seluruh kolom sebelum melanjutkan.</p>{rows.length ? <div className="stake-table-wrap"><table className="stake-table"><thead><tr><th>Stakeholder</th><th>Peran</th><th>Tugas utama</th><th>PIC (nama / jabatan)</th><th>Batas waktu</th><th>Aksi</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.kind}-${row.name}`}><td data-label="Stakeholder"><strong>{row.name}</strong><small>{row.kind === 'internal' ? 'Internal Ditpolairud' : 'Eksternal / lintas instansi'}</small></td><td data-label="Peran"><select aria-label={`Peran ${row.name}`} value={row.role} onChange={(e) => update(row.name, row.kind, 'role', e.target.value)}>{stakeholderRoles.map((role) => <option key={role}>{role}</option>)}</select></td><td data-label="Tugas utama"><textarea aria-label={`Tugas utama ${row.name}`} maxLength={500} placeholder="Tugas spesifik" value={row.task} onChange={(e) => update(row.name, row.kind, 'task', e.target.value)} /></td><td data-label="PIC"><input aria-label={`PIC ${row.name}`} maxLength={150} placeholder="Nama / jabatan" value={row.pic} onChange={(e) => update(row.name, row.kind, 'pic', e.target.value)} /></td><td data-label="Batas waktu"><input aria-label={`Batas waktu ${row.name}`} type="datetime-local" value={row.due} onChange={(e) => update(row.name, row.kind, 'due', e.target.value)} /></td><td data-label="Aksi"><button className="stake-remove" type="button" aria-label={`Hapus ${row.name}`} onClick={() => toggle(row.name, row.kind)}><Trash2 size={17} /></button></td></tr>)}</tbody></table></div> : <div className="stake-empty">Pilih stakeholder pada panel B untuk mulai membagi tugas.</div>}</section>
      <section className="stake-section"><h4>D. Catatan / Arahan Pimpinan</h4><textarea className="leader-notes" maxLength={500} placeholder="Arahan koordinasi, keselamatan personel, atau tindakan prioritas..." value={String(draft.leaderNotes || '')} onChange={(e) => setDraft((old) => ({ ...old, leaderNotes: e.target.value }))} /><small className="count-hint">{String(draft.leaderNotes || '').length}/500</small></section>
    </div><div className="stakeholder-side">
      <section className="stake-section"><h4>B. Pilih Stakeholder</h4><div className="stake-tabs" role="group" aria-label="Kelompok stakeholder"><button type="button" className={tab === 'internal' ? 'active' : ''} onClick={() => setTab('internal')}>Internal Ditpolairud</button><button type="button" className={tab === 'external' ? 'active' : ''} onClick={() => setTab('external')}>Eksternal / lintas instansi</button></div><div className="stake-search"><Search size={17} /><input aria-label="Cari stakeholder" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari unit atau instansi..." /></div><div className="stake-choice-list">{directoryLoading ? <p className="stake-hint">Memuat master stakeholder...</p> : entries.filter((entry) => entry.name.toLowerCase().includes(query)).map((entry) => <label key={entry.id}><input type="checkbox" checked={rows.some((row) => row.kind === entry.kind && row.name === entry.name)} onChange={() => toggle(entry.name, entry.kind)} /><span>{entry.kind === 'internal' ? <ShieldCheck size={22} /> : <Users size={22} />}</span><span><b>{entry.name}</b><small>{entry.detail || 'Koordinasi penanganan informasi'}</small></span>{canManage && <button className="stake-directory-toggle" type="button" disabled={directorySaving} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void setDirectoryActive(entry, false); }}>Nonaktifkan</button>}</label>)}{!directoryLoading && !entries.length && <p className="stake-hint">Belum ada stakeholder aktif pada kelompok ini.</p>}{query && !entries.some((entry) => entry.name.toLowerCase().includes(query)) && <p className="stake-hint">Tidak ada yang cocok.</p>}</div><p className="stake-hint">{rows.filter((row) => row.kind === 'internal').length} unit internal · {rows.filter((row) => row.kind === 'external').length} instansi eksternal dipilih</p>{directoryError && <p className="stake-directory-error">{directoryError}</p>}{canManage && <form className="stake-directory-form" onSubmit={addDirectoryEntry}><b>Kelola master stakeholder</b><input required maxLength={150} placeholder="Nama unit atau instansi" value={newEntry.name} onChange={(event) => setNewEntry((old) => ({ ...old, name: event.target.value }))} /><select value={newEntry.kind} onChange={(event) => setNewEntry((old) => ({ ...old, kind: event.target.value as 'internal' | 'external' }))}><option value="internal">Internal Ditpolairud</option><option value="external">Eksternal / lintas instansi</option></select><input maxLength={500} placeholder="Keterangan peran (opsional)" value={newEntry.detail} onChange={(event) => setNewEntry((old) => ({ ...old, detail: event.target.value }))} /><button className="secondary" disabled={directorySaving}>{directorySaving ? 'Menyimpan...' : 'Tambah stakeholder'}</button></form>}</section>
      <section className="stake-section"><h4>E. Lampiran (Opsional)</h4><label className="stake-upload" htmlFor="stake-documents"><FileUp size={28} /><b>{uploading ? 'Mengunggah...' : 'Unggah dokumen pendukung'}</b><small>SOP, surat tugas, peta · PDF/JPG/PNG · maks. 10 MB per file, 5 file per kasus</small></label><input className="visually-hidden" id="stake-documents" type="file" accept="application/pdf,image/jpeg,image/png" multiple disabled={uploading || documents.length >= 5} onChange={onUpload} />{documents.length > 0 && <div className="stake-documents">{documents.map((document) => <a key={document.id} href={`/api/incidents/${encodeURIComponent(incident.id)}/documents/${document.id}`} target="_blank" rel="noopener noreferrer"><ClipboardList size={17} /><span>{document.filename}</span><ArrowRight size={14} /></a>)}</div>}</section>
      <section className="stake-section stake-output"><h4>Output Tahap Ini</h4><p>Peran dan batas waktu menjadi dasar koordinasi pada tahap respons. Instansi eksternal terpilih memperoleh akses ke kasus setelah tahap ini dilanjutkan.</p></section>
      <AuditTrail incidentId={incident.id} />
    </div></div>
  </div>;
}

export function StakeholderSummary({ incidentId, rows, documents }: { incidentId: string; rows: StakeholderRow[]; documents: StakeholderDocument[] }) {
  if (!rows.length && !documents.length) return null;
  return <section className="panel stakeholder-readonly"><h2><Users size={20} /> Pembagian Peran Stakeholder</h2>{rows.length > 0 && <div className="stake-table-wrap"><table className="stake-table"><thead><tr><th>Stakeholder</th><th>Peran</th><th>Tugas</th><th>PIC</th><th>Batas waktu</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.kind}-${row.name}`}><td data-label="Stakeholder"><strong>{row.name}</strong></td><td data-label="Peran">{row.role}</td><td data-label="Tugas">{row.task}</td><td data-label="PIC">{row.pic}</td><td data-label="Batas waktu">{row.due ? new Date(row.due).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td></tr>)}</tbody></table></div>}{documents.length > 0 && <div className="stake-documents">{documents.map((document) => <a key={document.id} href={`/api/incidents/${encodeURIComponent(incidentId)}/documents/${document.id}`} target="_blank" rel="noopener noreferrer"><ClipboardList size={17} /><span>{document.filename}</span><ArrowRight size={14} /></a>)}</div>}</section>;
}
