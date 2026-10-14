'use client';

import { useEffect, useRef, useState } from 'react';
import { Anchor, Archive, Check, Coffee, QrCode, X } from 'lucide-react';
import {
  grantArchiveAccess,
  grantSpecialBottleAccess,
  type SpecialBottleType,
  type SupportConfirmation,
} from '@/lib/auth';

const SUPPORT_OPTIONS = [
  {
    id: 'special-bottle',
    icon: Anchor,
    title: 'Special Bottle',
    subtitle: 'Rp 20.000',
    description: 'Buka satu varian eksklusif untuk menemani pesanmu.',
  },
  {
    id: 'archive',
    icon: Archive,
    title: 'Peti Kenangan',
    subtitle: 'Rp 10.000',
    description: 'Buka kembali riwayat botol yang kamu hanyutkan.',
  },
  {
    id: 'tip',
    icon: Coffee,
    title: 'Traktir Kopi Penjaga Sungai',
    subtitle: 'Penjaga Sungai',
    description: 'Donasi sukarela mulai Rp 2.000, tanpa item digital.',
  },
] as const;

type SupportOptionId = (typeof SUPPORT_OPTIONS)[number]['id'];
type PaymentStep = 'options' | 'qris' | 'submitted' | 'complete';

const WHATSAPP_NUMBER = '6282181294792';
const SPECIAL_ACTIVATION_CODE = 'SUNGAI-SPECIAL-2026';
const ARCHIVE_ACTIVATION_CODE = 'ARCHIVE-PASS';

const SPECIAL_VARIANTS: { value: SpecialBottleType; label: string; description: string }[] = [
  { value: 'anchor', label: 'Botol Emas', description: 'Kilau abadi' },
  { value: 'crystal', label: 'Kristal Malam', description: 'Bias biru berbintang' },
  { value: 'jade', label: 'Giok Laut Dalam', description: 'Giok dan tembaga' },
  { value: 'lantern', label: 'Lentera Kertas', description: 'Cahaya hangat' },
];

interface SupportModalProps {
  onClose: () => void;
  onSupportConfirmed: (confirmation: SupportConfirmation) => void;
  initialVariant?: SpecialBottleType | null;
}

export default function SupportModal({ onClose, onSupportConfirmed, initialVariant }: SupportModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [selectedOption, setSelectedOption] = useState<SupportOptionId | null>(
    initialVariant ? 'special-bottle' : null
  );
  const [selectedVariant, setSelectedVariant] = useState<SpecialBottleType>(initialVariant ?? 'anchor');
  const [tipAmount, setTipAmount] = useState('2000');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('options');
  const [remainingSeconds, setRemainingSeconds] = useState(5);
  const [senderIdentity, setSenderIdentity] = useState('');
  const [senderError, setSenderError] = useState<string | null>(null);
  const [activationCode, setActivationCode] = useState('');
  const [activationFeedback, setActivationFeedback] = useState<string | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (paymentStep !== 'qris' || remainingSeconds <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [paymentStep, remainingSeconds]);

  const canContinue =
    selectedOption !== null &&
    (selectedOption !== 'tip' || Number(tipAmount) >= 2000);
  const paymentAmount = selectedOption === 'special-bottle'
    ? 20000
    : selectedOption === 'archive'
      ? 10000
      : Number(tipAmount);
  const selectedProductName = selectedOption === 'special-bottle'
    ? `Special Bottle (${SPECIAL_VARIANTS.find((variant) => variant.value === selectedVariant)?.label})`
    : selectedOption === 'archive'
      ? 'Peti Kenangan'
      : 'Traktir Kopi Penjaga Sungai';
  const whatsappMessage = `Halo Penjaga Sungai, saya sudah melakukan pembayaran sebesar Rp ${paymentAmount.toLocaleString('id-ID')} untuk ${selectedProductName} atas nama ${senderIdentity.trim()}. Mohon bantu verifikasi untuk perangkat ini.`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleActivateCode = () => {
    const normalizedCode = activationCode.trim().toUpperCase();
    if (normalizedCode === SPECIAL_ACTIVATION_CODE) {
      grantSpecialBottleAccess(selectedVariant);
      onSupportConfirmed({ product: 'special-bottle', variant: selectedVariant });
      setActivationFeedback(`${SPECIAL_VARIANTS.find((variant) => variant.value === selectedVariant)?.label} berhasil dibuka di perangkat ini.`);
      return;
    }
    if (normalizedCode === ARCHIVE_ACTIVATION_CODE) {
      grantArchiveAccess();
      onSupportConfirmed({ product: 'archive' });
      setActivationFeedback('Peti Kenangan berhasil dibuka di perangkat ini.');
      return;
    }
    setActivationFeedback('Kode belum cocok. Periksa kembali pesan dari Penjaga Sungai.');
  };

  const handleConfirmPayment = () => {
    if (!selectedOption) return;

    if (selectedOption === 'special-bottle') {
      grantSpecialBottleAccess(selectedVariant);
      onSupportConfirmed({ product: 'special-bottle', variant: selectedVariant });
    } else if (selectedOption === 'archive') {
      grantArchiveAccess();
      onSupportConfirmed({ product: 'archive' });
    } else {
      onSupportConfirmed({ product: 'tip' });
    }

    setPaymentStep('complete');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      aria-describedby="support-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <section
        className="relative w-full max-w-3xl overflow-y-auto rounded-2xl border border-amber-200 bg-[#fdfbf7] p-5 text-slate-800 shadow-2xl sm:p-8 max-h-[92vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Tutup dukungan"
          title="Tutup"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-amber-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="pr-10">
          <p className="font-mono text-[10px] uppercase text-amber-700">
            Kiosk Pelabuhan
          </p>
          <h2 id="support-modal-title" className="mt-1 font-serif text-2xl font-bold sm:text-3xl">
            Dukung arus tetap hidup
          </h2>
          <p id="support-modal-description" className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Pilih cara kecilmu menjaga sungai ini. Setiap dukungan adalah cahaya di perjalanan.
          </p>
        </div>

        {paymentStep === 'submitted' ? (
          <div className="mt-7 rounded-xl border border-sky-200 bg-sky-50 p-6 text-center animate-fade-in">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-800">
              <Check size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-3 font-serif text-xl font-bold text-sky-950">Menunggu verifikasi</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-sky-900">
              WhatsApp sudah dibuka dengan rincian pembayaranmu. Penjaga Sungai akan memeriksa transfer secara manual dan mengirim kode aktivasi setelah pembayaran terverifikasi.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-lg border border-sky-300 bg-white px-4 py-2.5 text-sm font-medium text-sky-900 transition-colors hover:bg-sky-100"
            >
              Buka WhatsApp lagi
            </a>
          </div>
        ) : paymentStep === 'complete' ? (
          <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center animate-fade-in">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-3 font-serif text-xl font-bold text-emerald-950">
              {selectedOption === 'tip' ? 'Terima kasih sudah singgah' : 'Pembayaran simulasi dikonfirmasi'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-emerald-800">
              {selectedOption === 'tip'
                ? 'Traktiranmu tercatat sebagai simulasi dukungan. Tip tidak membuka fitur atau item digital.'
                : selectedOption === 'special-bottle'
                  ? `${SPECIAL_VARIANTS.find((variant) => variant.value === selectedVariant)?.label} terbuka di perangkat ini. Ini hanya simulasi, tidak ada pembayaran nyata.`
                  : 'Peti Kenangan terbuka di perangkat ini. Ini hanya simulasi, tidak ada pembayaran nyata.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Kembali ke sungai
            </button>
          </div>
        ) : paymentStep === 'qris' ? (
          <div className="mt-7 animate-fade-in">
            <button
              type="button"
              onClick={() => setPaymentStep('options')}
              className="mb-4 text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              ← Kembali ke pilihan
            </button>
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sky-300 bg-sky-50/70 p-6 text-center">
                <div className="flex h-44 w-44 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-slate-400">
                  <img
                    src="/images/merchant_qris_botol.jpg"
                    alt="QRIS Merchant PesanBotol"
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase text-sky-800">QRIS Resmi Pembayaran</p>
                <p className="mt-1 text-xs text-slate-600">Scan dengan m-Banking / E-Wallet apa saja</p>
                <label htmlFor="payment-sender-identity" className="mt-4 w-full text-left text-xs font-medium text-slate-700">
                  Nama Pengirim atau 3 Digit Terakhir No. Rekening
                </label>
                <input
                  id="payment-sender-identity"
                  type="text"
                  autoComplete="name"
                  value={senderIdentity}
                  onChange={(event) => {
                    setSenderIdentity(event.target.value);
                    setSenderError(null);
                  }}
                  placeholder="Contoh: Fulan 123"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
                {senderError && (
                  <p role="alert" className="mt-1 w-full text-left text-[11px] text-red-700">
                    {senderError}
                  </p>
                )}
                <p aria-live="polite" className="mt-2 text-[11px] leading-relaxed text-slate-600">
                  {remainingSeconds > 0
                    ? `Mohon pindai QRIS dan selesaikan transfer. Konfirmasi tersedia dalam ${remainingSeconds} detik.`
                    : 'Isi identitas transfer setelah pembayaran selesai untuk mengonfirmasi via WhatsApp.'}
                </p>
              </div>
              <div className="flex flex-col justify-center rounded-xl border border-amber-200 bg-white/80 p-5">
                <p className="font-mono text-[10px] uppercase text-amber-700">Rincian dukungan</p>
                <h3 className="mt-2 font-serif text-lg font-bold text-slate-900">
                  {selectedOption === 'special-bottle'
                    ? `Special Bottle · ${SPECIAL_VARIANTS.find((variant) => variant.value === selectedVariant)?.label}`
                    : selectedOption === 'archive'
                      ? 'Peti Kenangan'
                      : 'Traktir Kopi Penjaga Sungai'}
                </h3>
                <p className="mt-4 text-xs text-slate-500">Total harga</p>
                <p className="font-mono text-2xl font-semibold text-sky-900">
                  Rp {paymentAmount.toLocaleString('id-ID')}
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                  Lakukan pembayaran sesuai nominal dengan scan QR di sebelah.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={remainingSeconds > 0}
                onClick={(event) => {
                  if (remainingSeconds > 0) {
                    event.preventDefault();
                    return;
                  }
                  if (!senderIdentity.trim()) {
                    event.preventDefault();
                    setSenderError('Masukkan nama pengirim dan 3 digit terakhir rekening terlebih dahulu.');
                    return;
                  }
                  setPaymentStep('submitted');
                }}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 ${remainingSeconds > 0 ? 'pointer-events-none cursor-not-allowed bg-slate-400' : 'bg-sky-800 hover:bg-sky-900'}`}
              >
                Konfirmasi via WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {SUPPORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedOption === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedOption(option.id)}
                    className={`flex min-h-36 flex-col items-start rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 shadow-md'
                        : 'border-slate-200 bg-white/80 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${isSelected ? 'bg-amber-100 text-amber-800' : 'bg-sky-50 text-sky-800'}`}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="mt-3 font-serif text-base font-bold">{option.title}</span>
                    <span className="text-[11px] font-mono text-amber-700">{option.subtitle}</span>
                    <span className="mt-2 text-xs leading-relaxed text-slate-600">{option.description}</span>
                  </button>
                );
              })}
            </div>

            {selectedOption === 'special-bottle' && (
              <fieldset className="mt-5 rounded-xl border border-amber-200 bg-white/70 p-4 animate-fade-in">
                <legend className="px-1 text-xs font-semibold text-slate-700">Pilih varian yang dibuka</legend>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIAL_VARIANTS.map((variant) => (
                    <button
                      key={variant.value}
                      type="button"
                      role="radio"
                      aria-checked={selectedVariant === variant.value}
                      onClick={() => setSelectedVariant(variant.value)}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${selectedVariant === variant.value ? 'border-amber-500 bg-amber-50 text-amber-950' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'}`}
                    >
                      <span className="block text-sm font-semibold">{variant.label}</span>
                      <span className="mt-0.5 block text-[11px]">{variant.description}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Rp 20.000 · Membuka varian yang dipilih di perangkat ini.</p>
              </fieldset>
            )}

            {selectedOption === 'archive' && (
              <p className="mt-5 rounded-xl border border-sky-200 bg-sky-50/80 p-4 text-sm leading-relaxed text-sky-950 animate-fade-in">
                Arsip privat direncanakan hanya bisa dibuka oleh pemilik pesan setelah akun dan penyimpanan aman tersedia.
              </p>
            )}

            {selectedOption === 'tip' && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-white/70 p-4 animate-fade-in">
                <label htmlFor="support-tip-amount" className="block text-xs font-semibold text-slate-700">
                  Nominal sukarela (Rupiah)
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                    {['2000', '5000', '10000'].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      aria-pressed={tipAmount === amount}
                      onClick={() => setTipAmount(amount)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${tipAmount === amount ? 'border-amber-500 bg-amber-100 text-amber-950' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'}`}
                    >
                      Rp {Number(amount).toLocaleString('id-ID')}
                    </button>
                  ))}
                  <input
                    id="support-tip-amount"
                    type="number"
                    min="2000"
                    step="1000"
                    value={tipAmount}
                    onChange={(event) => setTipAmount(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Mulai Rp 2.000. Murni donasi, tanpa item digital atau hak akses fitur.</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-1 py-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => {
                  setRemainingSeconds(5);
                  setPaymentStep('qris');
                }}
                className="shrink-0 rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                Lanjut Transaksi
              </button>
            </div>
          </>
        )}

        <details className="mt-6 border-t border-slate-200 pt-4">
          <summary className="cursor-pointer text-xs font-medium text-slate-600 transition-colors hover:text-sky-800">
            Punya Kode Aktivasi dari Penjaga Sungai?
          </summary>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={activationCode}
              onChange={(event) => setActivationCode(event.target.value)}
              aria-label="Kode Aktivasi"
              placeholder="Masukkan kode aktivasi"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
            <button
              type="button"
              disabled={!activationCode.trim()}
              onClick={handleActivateCode}
              className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Aktifkan kode
            </button>
          </div>
          {activationFeedback && (
            <p role="status" className="mt-2 text-xs leading-relaxed text-emerald-800">
              {activationFeedback}
            </p>
          )}
        </details>
      </section>
    </div>
  );
}