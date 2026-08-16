import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard APBD Provinsi Lampung — Monitoring Anggaran Pendidikan 20%',
  description: 'Sistem monitoring & validasi kepatuhan alokasi 20% APBD Pendidikan Provinsi Lampung (UUD 1945 Pasal 31 Ayat 4).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
