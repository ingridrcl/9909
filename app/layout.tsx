import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: '9909 — Resep & Informed Consent',
  description: 'Rapikan resep dan siapkan draft informed consent.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
