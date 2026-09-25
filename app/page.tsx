import Dashboard from './dashboard';
import { currentAccess } from './access';
import { chatGPTSignInPath, chatGPTSignOutPath } from './chatgpt-auth';
import { LockKeyhole, ShieldCheck, Waves } from 'lucide-react';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let session: Awaited<ReturnType<typeof currentAccess>>;
  try { session = await currentAccess(); }
  catch { return <main className="auth-screen"><section className="auth-card"><ShieldCheck size={40} /><h1>SIRATSI <span className="login-brand-expansion">(Strategi - Sistem - Instrumen - Hasil)</span></h1><p>Layanan data sedang tidak tersedia. Silakan coba lagi beberapa saat.</p></section></main>; }
  if (session.access) return <Dashboard access={session.access} />;
  return <main className="auth-screen"><section className="auth-card"><div className="auth-brand"><Waves size={32} /><span>SIRATSI <small className="login-brand-expansion">(Strategi - Sistem - Instrumen - Hasil)</small></span></div><h1>{session.signedIn ? 'Akun belum memiliki akses' : 'Masuk ke SIRATSI'}</h1><p>{session.signedIn ? 'Minta Super Admin menambahkan email akun ini dan menetapkan peran serta instansinya.' : 'Masuk untuk mengelola informasi, penanganan, dan koordinasi keamanan laut.'}</p><div className="auth-details"><LockKeyhole size={19} /><span>Hanya akun yang didaftarkan Super Admin yang dapat mengakses data.</span></div><LoginForm /><div className="auth-divider"><span>atau</span></div>{session.signedIn ? <a className="auth-alt-button" href={chatGPTSignOutPath('/')} target="_top">Ganti akun ChatGPT</a> : <a className="auth-alt-button" href={chatGPTSignInPath('/')} target="_top">Masuk dengan ChatGPT</a>}<small>Strategi · Sistem · Instrumen · Hasil</small></section><div className="auth-art" role="img" aria-label="Ilustrasi kapal patroli di perairan" /></main>;
}
