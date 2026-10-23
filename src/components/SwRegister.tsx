'use client';

import { useEffect } from 'react';

// Mendaftarkan Service Worker Push Notification di setiap muatan halaman.
// Disimpan di komponen klien terpisah karena Root Layout (layout.tsx) harus
// tetap Server Component agar bisa mengekspor `metadata`.
export default function SwRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[PesanBotol] Gagal mendaftarkan service worker:', err);
      });
    }
  }, []);

  return null;
}
