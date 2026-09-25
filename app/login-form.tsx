'use client';

import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Gagal masuk.');
      window.location.assign('/');
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal masuk.'); setBusy(false); }
  }
  return <form className="login-form" onSubmit={signIn}>
    <label htmlFor="login-email">Email</label><div className="login-field"><Mail size={19} aria-hidden="true" /><input id="login-email" type="email" autoComplete="username" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@instansi.go.id" /></div>
    <label htmlFor="login-password">Kata sandi</label><div className="login-field"><LockKeyhole size={19} aria-hidden="true" /><input id="login-password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" /><button type="button" aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
    {error && <p className="login-error" role="alert">{error}</p>}
    <button className="auth-button login-submit" disabled={busy} type="submit">{busy ? 'Memeriksa akun...' : 'Masuk'}</button>
  </form>;
}
