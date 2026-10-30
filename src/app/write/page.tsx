'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Anchor, Compass, Gem, Leaf, Sparkles } from 'lucide-react';
import { supabase, createBottle, getOceanLabel, OCEAN_LABELS } from '@/lib/supabase';
import type { BottleType } from '@/lib/supabase';
import { findInappropriateWords } from '@/lib/contentFilter';
import { enqueueNotification } from '@/lib/notifications';
import {
  getDeviceToken,
  getUnlockedSpecialBottles,
  SPECIAL_BOTTLE_VARIANTS,
  type SpecialBottleType,
  type SupportConfirmation,
} from '@/lib/auth';
import SupportModal from '@/components/SupportModal';

const MAX_LENGTH = 250;

const BOTTLE_OPTIONS: {
  value: BottleType;
  label: string;
  description: string;
}[] = [
  { value: 'glass', label: 'Botol Kaca', description: 'Klasik & tembus pandang' },
  { value: 'scroll', label: 'Gulungan', description: 'Ringan, seperti surat kuno' },
  { value: 'anchor', label: 'Botol Emas', description: 'Kilau abadi yang menjaga pesanmu' },
  { value: 'crystal', label: 'Botol Kristal Malam', description: 'Bias biru bertabur bintang' },
  { value: 'jade', label: 'Botol Giok Laut Dalam', description: 'Rona giok dengan sentuhan tembaga' },
  { value: 'lantern', label: 'Botol Lentera Kertas', description: 'Cahaya hangat di arus malam' },
];

function WriteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replyTo = searchParams.get('replyTo');
  const replyToId = searchParams.get('replyToId');

  const [message, setMessage] = useState('');
  const [bottleType, setBottleType] = useState<BottleType>('glass');
  const [selectedOcean, setSelectedOcean] = useState<string>('Lautan-Harapan');
  const [unlockedSpecialBottles, setUnlockedSpecialBottles] = useState<SpecialBottleType[]>([]);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [requestedSupportVariant, setRequestedSupportVariant] = useState<SpecialBottleType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeviceToken();
    setUnlockedSpecialBottles(getUnlockedSpecialBottles());
  }, []);

  const replyContext =
    replyTo && replyTo.length > MAX_LENGTH
      ? `${replyTo.slice(0, MAX_LENGTH)}…`
      : replyTo;

  // Deteksi kata terlarang secara real-time
  const blockedWords = findInappropriateWords(message);
  const hasInappropriateWords = blockedWords.length > 0;

  const remaining = MAX_LENGTH - message.length;
  const canSubmit = message.trim().length > 0 && !isSubmitting && !hasInappropriateWords;

  const counterColor =
    remaining === 0
      ? 'text-red-500'
      : remaining <= 50
        ? 'text-amber-500'
        : 'text-slate-400';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validasi filter kata
    const detected = findInappropriateWords(message);
    if (detected.length > 0) {
      setError(
        `Pesan mengandung kata yang tidak pantas ("${detected.join(', ')}"). Mohon gunakan bahasa yang bijak dan santun.`
      );
      return;
    }

    if (!canSubmit) return;

    const selectedSpecialVariant = SPECIAL_BOTTLE_VARIANTS.find((variant) => variant === bottleType);
    if (selectedSpecialVariant && !unlockedSpecialBottles.includes(selectedSpecialVariant)) {
      setError('Varian ini belum terbuka di perangkatmu. Buka melalui Special Bottle untuk melanjutkan.');
      return;
    }

    const ownerToken = getDeviceToken();
    if (!ownerToken) {
      setError('Token perangkat tidak tersedia. Periksa izin penyimpanan browser, lalu coba lagi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Jika membalas botol tertentu, simpan dengan prefix "Balasan untuk <id>: <pesan>"
      // agar terikat dan dikenali sebagai balasan di aliran sungai
      const finalContent =
        replyToId && !message.startsWith('Balasan untuk')
          ? `Balasan untuk ${replyToId}: ${message.trim()}`
          : message.trim();

      const newBottle = await createBottle({
        content: finalContent,
        bottle_type: bottleType,
        owner_token: ownerToken,
        laut: selectedOcean,
      });

      // Jika ini adalah balasan, tambahkan ke antrian notifikasi pemilik botol induk.
      // targetBottleId diset ke ID botol balasan yang baru dibuat agar saat notifikasi
      // diklik, botol balasan (bukan botol induk) yang mendapat visual highlight.
      if (replyToId) {
        // Ambil owner_token dari botol induk untuk menargetkan notifikasi
        if (supabase) {
          const { data: parentBottle } = await supabase
            .from('bottles')
            .select('owner_token')
            .eq('id', parseInt(replyToId, 10))
            .single();
          if (parentBottle?.owner_token) {
            await enqueueNotification({
              deviceToken: parentBottle.owner_token,
              targetBottleId: newBottle.id,
              content: message.trim(),
            });

            // Jika jumlah balasan ke botol induk telah mencapai 5, kirim notifikasi mention
            // ke pemilik botol induk agar mengetahui pesan mereka di-mention dalam arus sungai.
            const { count: totalReplies } = await supabase
              .from('bottles')
              .select('*', { count: 'exact', head: true })
              .ilike('content', `Balasan untuk ${replyToId}:%`);
            if (totalReplies === 5) {
              await enqueueNotification({
                deviceToken: parentBottle.owner_token,
                targetBottleId: newBottle.id,
                content: 'Pesan kamu di-mention oleh seseorang dari arus sungai',
              });
            }
          }
        }
      }

      // Sukses tersimpan → kembali ke halaman utama
      router.push('/');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.'
      );
      setIsSubmitting(false); // izinkan pengguna mencoba lagi
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in rounded-2xl border border-white/40 bg-[#fdfbf7] p-6 text-slate-800 shadow-2xl sm:p-8">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-amber-700">
        Tulis Pesan
      </p>
      <h1 className="mb-4 font-serif text-2xl font-bold">Pesan Botol Baru</h1>

      {/* Konteks balasan (opsional, dari tombol "Kirim Balasan" di halaman utama) */}
      {replyContext && (
        <p className="mb-4 rounded-md border border-sky-200 bg-sky-100 px-3 py-2 text-xs text-sky-900">
          💬 Balasan untuk: {replyContext}
        </p>
      )}

      {/* Pemilihan cabang laut */}
      <fieldset disabled={isSubmitting} className="flex flex-col gap-2">
        <legend className="font-mono text-xs text-slate-500">
          Pilih cabang laut
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(OCEAN_LABELS).map(([value, label]) => {
            const isActive = selectedOcean === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedOcean(value)}
                aria-pressed={isActive}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isActive
                    ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <Compass size={16} aria-hidden="true" />
                <span className="font-medium">{label}</span>
                <span className="text-[10px] opacity-70">{value}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Pesan + penghitung karakter real-time */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="bottle-message"
              className="font-mono text-xs text-slate-500"
            >
              Isi pesan:
            </label>
            <span
              className={`text-xs font-mono transition-colors ${counterColor}`}
              aria-live="polite"
            >
              {remaining} tersisa
            </span>
          </div>
          <textarea
            id="bottle-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.slice(0, MAX_LENGTH));
              if (error) setError(null);
            }}
            maxLength={MAX_LENGTH}
            rows={5}
            placeholder="Tuliskan rahasia, beban, atau harapanmu…"
            disabled={isSubmitting}
            autoFocus
            className={`w-full resize-none rounded-lg border p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-60 transition-colors ${
              hasInappropriateWords
                ? 'border-red-400 bg-red-50/50 focus:ring-red-500'
                : 'border-slate-300 bg-white focus:ring-sky-600'
            }`}
          />
          <div className="flex items-center justify-between">
            {hasInappropriateWords ? (
              <span className="font-mono text-xs text-red-600 flex items-center gap-1">
                <span>🚫</span> Terdeteksi kata tidak pantas: <b className="font-bold">{blockedWords.join(', ')}</b>
              </span>
            ) : (
              <span />
            )}
            <span className="text-right font-mono text-[10px] text-slate-400">
              {message.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>

        {/* Pilihan jenis botol */}
        <fieldset disabled={isSubmitting} className="flex flex-col gap-2">
          <legend className="font-mono text-xs text-slate-500">
            Pilih jenis botol
          </legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BOTTLE_OPTIONS.map((option) => {
              const isActive = bottleType === option.value;
              const specialVariant = SPECIAL_BOTTLE_VARIANTS.find((variant) => variant === option.value);
              const isLocked = Boolean(specialVariant && !unlockedSpecialBottles.includes(specialVariant));
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (isLocked && specialVariant) {
                      setRequestedSupportVariant(specialVariant);
                      setIsSupportModalOpen(true);
                      return;
                    }
                    setBottleType(option.value);
                  }}
                  aria-pressed={isActive && !isLocked}
                  aria-haspopup={isLocked ? 'dialog' : undefined}
                  title={isLocked ? 'Buka lewat Special Bottle' : option.label}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isLocked
                      ? 'cursor-pointer border-amber-200 bg-white/70 text-slate-500 opacity-50 hover:opacity-70'
                      : isActive
                      ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {/* Miniatur visual */}
                  {option.value === 'glass' ? (
                    <span className="flex h-8 w-6 flex-col items-center justify-end rounded-t-sm rounded-b-md border border-cyan-300 bg-cyan-100/70">
                      <span className="mb-1 h-6 w-3 rounded-2xs bg-amber-50/90" />
                    </span>
                  ) : option.value === 'anchor' ? (
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-100 text-amber-800 shadow-[0_0_12px_rgba(251,191,36,0.45)]">
                      <Anchor size={18} aria-hidden="true" />
                    </span>
                  ) : option.value === 'crystal' ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-300 bg-slate-900 text-blue-200 shadow-[0_0_12px_rgba(96,165,250,0.45)]">
                      <Gem size={18} aria-hidden="true" />
                    </span>
                  ) : option.value === 'jade' ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-800 bg-emerald-950 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                      <Leaf size={18} aria-hidden="true" />
                    </span>
                  ) : option.value === 'lantern' ? (
                    <span className="relative flex h-8 w-6 items-center justify-center rounded-md border border-amber-500 bg-amber-200 text-amber-800 shadow-[0_0_12px_rgba(251,191,36,0.45)]">
                      <Sparkles size={15} aria-hidden="true" />
                      <span className="absolute -top-1 h-1 w-4 rounded-full bg-amber-700" />
                      <span className="absolute -bottom-1 h-1 w-4 rounded-full bg-amber-700" />
                    </span>
                  ) : (
                    <span className="h-8 w-4 rotate-2 rounded-2xs border border-amber-200 bg-amber-100 shadow-inner" />
                  )}
                  <span className="font-medium">{option.label}</span>
                  <span className="text-[10px] opacity-70">
                    {isLocked ? 'Eksklusif · Ketuk untuk membuka' : option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Pesan error dari server/klien */}
        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </p>
        )}

        {/* Aksi: kembali / hanyutkan */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <Link
            href="/"
            className="px-4 py-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
          >
            Kembali ke Sungai
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-slate-900 shadow-md transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900" />
                Mengirim…
              </>
            ) : (
              <>Hanyutkan ke Sungai 🌊</>
            )}
          </button>
        </div>
      </form>
      {isSupportModalOpen && (
        <SupportModal
          initialVariant={requestedSupportVariant}
          onClose={() => {
            setIsSupportModalOpen(false);
            setRequestedSupportVariant(null);
          }}
          onSupportConfirmed={(confirmation: SupportConfirmation) => {
            if (confirmation.product === 'special-bottle') {
              setUnlockedSpecialBottles(getUnlockedSpecialBottles());
            }
          }}
        />
      )}
    </div>
  );
}

export default function WritePage() {
  return (
    <main className="relative min-h-screen select-none overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#0369a1] to-[#0c4a6e]">
      {/* Latar belakang sungai yang tenang */}
      <div className="pointer-events-none absolute inset-0 animate-river-slow bg-[radial-gradient(#38bdf8_1px,transparent_1px)] opacity-20 [background-size:16px_16px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-sky-950/50 to-transparent" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mb-6 text-center">
          <Link href="/">
            <p className="font-serif text-3xl font-bold tracking-wide text-white drop-shadow-md">
              🧴 PesanBotol
            </p>
          </Link>
          <p className="mt-1 font-mono text-xs tracking-wide text-sky-100/80">
            Tulis pesanmu, lalu lepaskan ke arus.
          </p>
        </div>

        <Suspense fallback={null}>
          <WriteForm />
        </Suspense>
      </div>
    </main>
  );
}
