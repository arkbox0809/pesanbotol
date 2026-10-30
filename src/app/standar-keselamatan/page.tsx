import Link from 'next/link';
import { LegalTabs } from '@/components/LegalTabs';
import {
  ShieldCheck,
  FileText,
  Mail,
  Info,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

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

export default function StandarKeselamatanPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LegalTabs activeTab="standar-keselamatan" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-widest text-sky-600 hover:text-sky-700">
            <ShieldAlert size={14} aria-hidden="true" />
            Kembali ke Sungai
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Standar Keselamatan Anak PesanBotol
          </h1>
          <p className="mt-2 text-slate-600">
            Kebijakan resmi PesanBotol mengenai pencegahan pelecehan dan
            eksploitasi seksual terhadap anak (Child Sexual Abuse and
            Exploitation/CSAE) di seluruh ruang cerita dan interaksi layanan.
          </p>
        </div>

        {/* Meta info bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Tanggal Berlaku
            </p>
            <p className="text-sm font-medium"><Placeholder>29 Oktober 2026</Placeholder></p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Cakupan
            </p>
            <p className="text-sm font-medium">
              Seluruh lautan publik, lautan privat, cerita, dan balasan
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Kontak Keselamatan
            </p>
            <a
              href="mailto:pesanbotol@proton.me?subject=Laporan%20Keselamatan%20Anak%20-%20PesanBotol"
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
          Dokumen ini adalah standar keselamatan anak yang kami terapkan untuk
          setiap Pengguna dan harap selalu ditinjau agar sesuai dengan praktik
          layanan yang sudah disampaikan, dapat dimengerti, dan dipahami oleh
          Pengguna. Terima kasih.
        </Callout>

        {/* Statement */}
        <div className="mt-10 rounded-xl border border-slate-200 bg-sky-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="mt-0.5 text-sky-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-sm text-slate-900">
                Komitmen tanpa toleransi
              </p>
              <p className="mt-1 text-sm text-slate-600">
                PesanBotol melarang setiap bentuk pelecehan dan eksploitasi
                seksual terhadap anak, termasuk materi pelecehan seksual anak
                (CSAM). Aturan ini berlaku tanpa pengecualian pada lautan
                publik, lautan privat, cerita, dan balasan.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            1. Komitmen kami
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            PesanBotol adalah tempat berbagi cerita melalui pesan dalam botol.
            Privasi dan anonimitas dalam aplikasi tidak boleh digunakan untuk
            merugikan, mengeksploitasi, mengintimidasi, atau membahayakan anak.
          </p>
          <p className="text-sm leading-relaxed mb-4">
            Kebijakan ini berlaku untuk seluruh pengguna, konten, dan interaksi
            pada layanan PesanBotol, tanpa memandang apakah percakapan terjadi
            di lautan publik maupun privat.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            2. Perilaku yang dilarang
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            PesanBotol secara tegas melarang tindakan atau konten berikut:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 sm:list-outside sm:list-inside mb-6">
            <li>
              Membuat, meminta, menyimpan, menyebarkan, atau mengarahkan
              pengguna kepada materi pelecehan seksual anak (CSAM).
            </li>
            <li>
              Membujuk atau memanipulasi anak untuk tujuan seksual, termasuk{' '}
              <em>grooming</em>.
            </li>
            <li>
              Melakukan pemerasan seksual terhadap anak, termasuk{' '}
              <em>sextortion</em>.
            </li>
            <li>
              Mempromosikan, memfasilitasi, atau melakukan perdagangan dan
              eksploitasi seksual anak.
            </li>
            <li>
              Menggunakan cerita, balasan, kode lautan, atau ruang privat untuk
              mengatur, menyembunyikan, maupun mendukung perilaku CSAE.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            3. Cara melapor
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            Jika menemukan konten atau perilaku yang diduga membahayakan anak,
            segera laporkan melalui fitur pelaporan di aplikasi atau gunakan
            kontak keselamatan yang tercantum pada halaman ini.
          </p>
          <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 sm:list-outside sm:list-inside mb-6">
            <li>
              Gunakan opsi <b>Laporkan</b> pada cerita atau balasan yang
              bersangkutan jika tersedia.
            </li>
            <li>
              Jelaskan kekhawatiran secara ringkas. Cantumkan identifikasi
              cerita atau konteks kejadian bila memungkinkan.
            </li>
            <li>
              Jangan mengunduh, menyebarkan ulang, atau mengirim salinan materi
              yang diduga CSAM. Jika ada bahaya langsung, hubungi layanan
              darurat atau otoritas setempat.
            </li>
          </ol>
          <Callout kind="warn" icon={AlertTriangle} title="Peringatan keamanan">
            Jangan melampirkan materi CSAM dalam laporan. Berikan informasi yang
            cukup untuk membantu penanganan laporan.
          </Callout>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            4. Penanganan CSAM
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            Laporan yang berkaitan dengan keselamatan anak diprioritaskan untuk
            ditinjau. Jika ditemukan pelanggaran, pengelola dapat membatasi
            akses, menghapus atau menonaktifkan konten, dan membatasi atau
            menonaktifkan akun yang terlibat.
          </p>
          <p className="text-sm leading-relaxed mb-4">
            Untuk dugaan atau temuan CSAM, penanganan dilakukan sesuai hukum
            yang berlaku, termasuk pelaporan kepada otoritas yang relevan
            apabila diwajibkan. Kami tidak mengizinkan penyebaran ulang materi
            yang dilaporkan melalui sistem pelaporan publik.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            5. Kepatuhan hukum
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            PesanBotol berkomitmen mematuhi peraturan perlindungan anak yang
            berlaku dan bekerja sama dengan otoritas yang berwenang sesuai
            kewajiban hukum. Kebijakan ini menjadi dasar penegakan aturan
            komunitas terhadap konten atau perilaku yang mengeksploitasi anak.
          </p>
          <p className="text-sm leading-relaxed mb-4">
            Kami dapat memperbarui standar ini untuk menyesuaikan ketentuan
            hukum, kebijakan platform, dan kebutuhan keselamatan pengguna.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            6. Kontak keselamatan
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            Untuk laporan atau pertanyaan terkait dugaan CSAE pada PesanBotol,
            hubungi alamat berikut. Pesan akan digunakan untuk meninjau masalah
            keselamatan sesuai kebijakan layanan.
          </p>
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white">
            <a
              href="mailto:pesanbotol@proton.me?subject=Laporan%20Keselamatan%20Anak%20-%20PesanBotol"
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:underline break-all"
            >
              <Mail size={14} aria-hidden="true" />
              pesanbotol@proton.me
            </a>
            <p className="mt-2 text-sm text-slate-600 max-w-md">
              Mohon jangan melampirkan materi CSAM. Jika anak sedang dalam
              bahaya, segera hubungi otoritas setempat.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            PesanBotol &middot; Halaman keselamatan anak publik. Copyright by{' '}
            <Placeholder>Arus Nusantara</Placeholder> 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
