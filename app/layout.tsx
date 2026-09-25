import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'SIRATSI (Strategi - Sistem - Instrumen - Hasil) | Ditpolairud Polda Lampung',
  description: 'SIRATSI: Strategi, Sistem, Instrumen, Hasil untuk pencatatan informasi dan pemantauan respons keamanan laut.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
