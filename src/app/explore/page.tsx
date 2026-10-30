'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAvailableOceans, getOceanLabel } from '@/lib/supabase';
import { Compass } from 'lucide-react';
import { useEffect, useState } from 'react';

type OceanBranch = { laut: string; bottle_count: number };

export default function ExplorePage() {
  const router = useRouter();
  const [oceans, setOceans] = useState<OceanBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lautan Harapan adalah halaman default, arahkan ke halaman utama /
  const handleOceanClick = (laut: string) => {
    if (laut === 'Lautan-Harapan') {
      router.push('/');
      return;
    }
    router.push(`/explore/${encodeURIComponent(laut)}`);
  };

  useEffect(() => {
    let cancelled = false;
    getAvailableOceans()
      .then((data) => {
        if (!cancelled) {
          setOceans(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat daftar laut.');
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="font-mono text-sm text-slate-500">Memuat cabang laut…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdfbf7] text-slate-900">
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-sky-600 hover:text-sky-700"
          >
            ← Kembali ke Sungai
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Explore Laut
          </h1>
          <p className="mt-2 text-slate-600">
            Pilih cabang laut yang ingin dijelajahi. Setiap laut memiliki koleksi botol sendiri.
          </p>
        </div>

        {oceans.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
              Belum ada cabang laut dengan botol. Coba lagi nanti.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {oceans.map((ocean) => {
              const label = getOceanLabel(ocean.laut);
              return (
                <Link
                  key={ocean.laut}
                  href={
                    ocean.laut === 'Lautan-Harapan'
                      ? '/'
                      : `/explore/${encodeURIComponent(ocean.laut)}`
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    handleOceanClick(ocean.laut);
                  }}
                  className="group block rounded-xl border border-slate-200 bg-white p-6 hover:border-sky-300 hover:bg-sky-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Compass size={20} className="text-sky-600 group-hover:text-sky-700" aria-hidden="true" />
                    <h2 className="font-serif text-xl font-bold text-slate-900">{label}</h2>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    {ocean.bottle_count} botol{ocean.bottle_count !== 1 ? 's' : ''}
                  </p>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-xs font-mono text-slate-500">
                    {ocean.laut}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            PesanBotol &middot; Jelajahi cabang laut lain di PesanBotol.
          </p>
        </div>
      </div>
    </main>
  );
}
