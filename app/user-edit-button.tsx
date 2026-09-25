'use client';

import { useState } from 'react';
import { externalOrganizations } from './roles';

type User = { id: string; email: string; name: string; role: string; organization: string; active: number };

const roles = [
  ['internal_receiver', 'Penerima informasi internal'],
  ['leader_approver', 'Pimpinan pemberi persetujuan'],
  ['response_executor', 'Pelaksana respons'],
  ['external_stakeholder', 'Stakeholder eksternal'],
  ['super_admin', 'Super Admin'],
];

export function UserEditButton({ user, onSaved }: { user: User; onSaved: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role, organization: user.organization, active: Boolean(user.active) });
  const openEditor = () => { setForm({ name: user.name, email: user.email, role: user.role, organization: user.organization, active: Boolean(user.active) }); setError(''); setOpen(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Pengguna belum dapat diperbarui.');
      await onSaved(); setOpen(false);
    } catch (error) { setError(error instanceof Error ? error.message : 'Pengguna belum dapat diperbarui.'); }
    finally { setSaving(false); }
  };
  return <><button className="secondary" onClick={openEditor}>Edit</button>{open && <form className="user-edit-panel" onSubmit={save}><h3>Edit pengguna</h3><label>Nama<input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Email<input required type="email" maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Peran<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roles.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>{form.role === 'external_stakeholder' && <label>Instansi<select value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })}>{externalOrganizations.map((organization) => <option key={organization}>{organization}</option>)}</select></label>}<label className="user-edit-active"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Akun aktif</label>{error && <p>{error}</p>}<div><button type="button" className="secondary" onClick={() => setOpen(false)}>Batal</button><button className="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan perubahan'}</button></div></form>}</>;
}
