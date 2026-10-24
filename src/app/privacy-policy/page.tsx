import Link from 'next/link';
import { LegalTabs } from '@/components/LegalTabs';
import { ShieldCheck, Mail, FileText, Info, AlertTriangle } from 'lucide-react';

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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LegalTabs activeTab="privacy" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-widest text-sky-600 hover:text-sky-700">
            <FileText size={14} aria-hidden="true" />
            Kembali ke Sungai
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Kebijakan Privasi PesanBotol
          </h1>
          <p className="mt-2 text-slate-600">
            Dokumentasi ini menjelaskan data yang kami kumpulkan, mengapa kami mengumpulkannya, dan bagaimana
            data tersebut dilindungi.
          </p>
        </div>

        {/* Meta info bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Tanggal Berlaku
            </p>
            <p className="text-sm font-medium"><Placeholder>23 Oktober 2026</Placeholder></p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Pengelola
            </p>
            <p className="text-sm font-medium"><Placeholder>Arus Nusantara</Placeholder></p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Kontak Bantuan
            </p>
            <a
              href="mailto:"
              className="text-sm font-medium text-sky-600 hover:underline break-all"
            >
              
              <Placeholder>pesanbotol@proton.me</Placeholder>
            </a>
          </div>
        </div>

        {/* Disclaimer callout */}
        <Callout
          kind="info"
          icon={Info}
          title="Sebelum membaca, harap pahami"
        >
          Dokumen ini adalah kebijakan privasi yang kami terapkan untuk setiap Pengguna dan 
          harap selalu ditinjau agar sesuai dengan praktik layanan yang sudah disampaikan benar-benar
          dapat dimengerti dan dipahami oleh Pengguna. Terima kasih.
        </Callout>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            1. Pengenalan
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            PesanBotol adalah aplikasi mini media sosial yang memungkinkan pengguna menyimpan rahasia,
            beban, atau harapan dalam botol digital yang dilemparkan ke "sungai" waktu. Kebijakan privasi ini
            menjelaskan data yang kami kumpulkan, mengapa kami mengumpulkannya, dan bagaimana data tersebut
            dilindungi.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            2. Data yang Diproses
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900 mb-2">
                2.1 Akun & Konten
              </h3>
              <p className="text-sm leading-relaxed mb-2">
                PesanBotol menggunakan email dan autentikasi Supabase untuk mengelola akun pengguna. Data yang
                diproses meliputi isi cerita dan balasan untuk fitur botol, serta laporan dan daftar blokir
                untuk moderasi.
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 sm:list-outside sm:list-inside">
                <li>Identitas penulis tidak ditampilkan dalam pembacaan cerita publik (anonim bagi publik).</li>
                <li>
                  Moderator tetap memiliki akses administratif untuk menangani penyalahgunaan.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900 mb-2">
                2.2 Notifikasi
              </h3>
              <p className="text-sm leading-relaxed mb-2">
                Firebase Cloud Messaging memproses token perangkat Android untuk notifikasi umum. Isi
                notifikasi bersifat umum, tanpa isi cerita atau nama penulis. Pengguna dapat menolak izin
                notifikasi melalui pengaturan perangkat.
              </p>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900 mb-2">
                2.3 Pembayaran
              </h3>
              <p className="text-sm leading-relaxed mb-2">
                Pembayaran diproses oleh Google Play. Backend memverifikasi token pembelian dan menyimpan hash
                token serta catatan hak akses untuk mencegah transaksi ganda dan menangani refund. Aplikasi
                tidak mengumpulkan nomor kartu pembayaran.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            3. Penghapusan Akun
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            Buka menu Akun, pilih Hapus akun permanen, lalu konfirmasi kata sandi.
          </p>
          <p className="text-sm leading-relaxed mb-4">
            Akibat penghapusan akun:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 sm:list-outside sm:list-inside mb-4">
            <li>Profil dan identitas login dihapus.</li>
            <li>Isi pesan penulis diganti penanda penghapusan.</li>
            <li>Laut privat milik akun dinonaktifkan.</li>
            <li>
              Catatan transaksi tanpa relasi ke akun tetap disimpan untuk penanganan refund dan audit selama{' '}
              <Placeholder>1 Bulan</Placeholder>.
            </li>
          </ul>
          <Callout kind="warn" icon={AlertTriangle} title="Refund">
            Penghapusan akun tidak otomatis menghasilkan refund Google Play.
          </Callout>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            4. Penyedia Layanan & Kontak
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            Infrastruktur melibatkan Supabase, Firebase/Google, dan Google Play. Pengelola bertanggung jawab
            mengatur akses administratif, lokasi layanan, cadangan, penanganan laporan, dan retensi sesuai
            kebutuhan operasional yang dipublikasikan.
          </p>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2 sm:col-span-1">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  Pengelola
                </dt>
                <dd className="mt-1 text-sm font-medium"><Placeholder>Arus Nusantara</Placeholder></dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  Kontak
                </dt>
                <dd className="mt-1 text-sm">
                  <a href="mailto:" className="text-sky-600 hover:underline break-all">
                    <Placeholder>pesanbotol@proton.me</Placeholder>
                  </a>
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  Berlaku
                </dt>
                <dd className="mt-1 text-sm font-medium"><Placeholder>23 Oktober 2026</Placeholder></dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            PesanBotol &middot; Halaman hukum publik. Copyright by Arus Nusantara 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
