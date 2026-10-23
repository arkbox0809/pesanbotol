import './global.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SwRegister from '@/components/SwRegister';

export const metadata: Metadata = {
  title: 'PesanBotol',
  description: 'Tempat membuang rahasia dan harapan ke arus waktu.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
