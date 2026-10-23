import Link from 'next/link';
import { LegalTabs } from '@/components/LegalTabs';
import { ShieldCheck, FileText, Mail, AlertTriangle, Info, Terminal } from 'lucide-react';

function Placeholder({ children }: { children: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-200 bg-amber-50/80 text-amber-900 text-[10px] font-mono font-bold uppercase tracking-tighter"
    >
      [{children}]
    </span>
  );
}

function Callout({
  kind = 'info',
  icon: Icon,
  title,
  children,
}: {
  kind?: 'info' | 'warn';
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  children: React.ReactNode;
}) {
  const isWarn = kind === 'warn';
  return (
    <div
      className={`rounded-xl border p-4 ${isWarn ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${isWarn ? 'text-amber-600' : 'text-sky-600'}`}>
          <Icon size={18} aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="mt-1 text-sm leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3 mb-5 last:mb-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
        {number}
      </div>
      <div>
        <p className="font-semibold text-sm text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LegalTabs activeTab="delete" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-widest text-sky-600 hover:text-sky-700">
            <ShieldCheck size={14} aria-hidden="true" />
            Kembali ke Sungai
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Instruksi Hapus Akun
          </h1>
          <p className="mt-2 text-slate-600">
            Panduan langkah demi langkah untuk menghapus akun PesanBotol secara permanen, baik melalui
            aplikasi Android maupun lewat email.
          </p>
        </div>

        {/* Access note callout */}
        <Callout kind="info" icon={Info} title="Penting dipahami sebelum menghapus akun">
          Halaman ini adalah dokumen panduan langkah penghapusan akun yang aman dan sesuai dengan kebijakan privasi kami.
          Apabila terjadi kesalahan atau ketidaksesuaian, harap hubungi email kami untuk klarifikasi sebelum melanjutkan proses penghapusan.
        </Callout>

        {/* Main method */}
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            1. Metode Utama (Lewat Aplikasi Android)
          </h2>
          <div className="space-y-0">
            <Step
              number={1}
              title="Buka aplikasi, masuk ke menu Akun"
              description="Jalankan aplikasi PesanBotol pada perangkat Android Anda, lalu buka menu Akun."
            />
            <Step
              number={2}
              title="Pilih Hapus akun permanen"
              description="Di dalam menu Akun, ketuk opsi Hapus akun permanen untuk memulai proses penghapusan."
            />
            <Step
              number={3}
              title="Masukkan kata sandi untuk mengonfirmasi"
              description="Masukkan kata sandi akun Anda sebagai konfirmasi bahwa Anda yakin ingin menghapus akun secara permanen."
            />
          </div>
        </section>

        {/* Impact */}
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            2. Dampak Penghapusan Akun
          </h2>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 sm:list-outside sm:list-inside mb-6">
            <li>Profil & identitas login dihapus permanen.</li>
            <li>Isi pesan diganti dengan penanda penghapusan.</li>
            <li>Laut privat milik akun dinonaktifkan.</li>
            <li>Catatan transaksi anonim tetap disimpan sesuai retensi hukum.</li>
          </ul>
          <Callout kind="warn" icon={AlertTriangle} title="Tidak otomatis refund">
            Penghapusan akun tidak otomatis melakukan pengembalian dana (refund).
          </Callout>
        </section>

        {/* Alternative method */}
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            3. Metode Alternatif (Tanpa Aplikasi / Lewat Email)
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                A
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Kirim email dari alamat terdaftar</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Kirim permintaan dari alamat email yang terdaftar pada akun Anda ke{' '}
                  <Placeholder>pesanbotol@proton.me</Placeholder>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                B
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Subjek email</p>
                <p className="mt-0.5 text-sm text-slate-600 font-mono">
                  "Hapus akun PesanBotol"
                </p>
              </div>
            </div>
          </div>
          <Callout kind="warn" icon={AlertTriangle} title="Peringatan keamanan">
            Jangan mengirim kata sandi atau data kartu pembayaran dalam email permintaan penghapusan.
          </Callout>
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm">
            <p className="font-semibold text-slate-900 mb-1">
              Verifikasi & Waktu Respons
            </p>
            <p className="text-slate-600">
              Pengelola akan memverifikasi kepemilikan akun dan merespons dalam{' '}
              <Placeholder>1 Bulan</Placeholder>.
            </p>
          </div>
        </section>

        {/* Technical note */}
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            4. Catatan Teknis Backend
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <Terminal size={16} className="mt-0.5 text-slate-500" aria-hidden="true" />
              <div>
                <p className="font-semibold text-sm text-slate-900">
                  Fungsi server delete_pesanbotol_account
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Permintaan penghapusan yang telah terverifikasi diproses penuh via fungsi server{' '}
                  <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    delete_pesanbotol_account
                  </code>
                  , bukan hanya menghapus baris profil atau menandai permintaan sebagai selesai.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            PesanBotol &middot; Halaman hukum publik. Isi semua placeholder sebelum menerbitkan.
          </p>
        </div>
      </div>
    </div>
  );
}
