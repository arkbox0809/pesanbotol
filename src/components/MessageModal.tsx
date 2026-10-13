import React, { useEffect, useRef, useState } from 'react';

export const REPORT_REASONS = [
  { id: 'inappropriate_words', label: 'Mengandung kata-kata tidak pantas' },
  { id: 'spam', label: 'Terbukti spam' },
  { id: 'gambling_ad', label: 'Terindikasi iklan judi online' },
  { id: 'harassment', label: 'Terindikasi konten pelecehan' },
  { id: 'bullying', label: 'Terindikasi bullying' },
  { id: 'unnecessary_politics', label: 'Terindikasi politik tidak perlu' },
] as const;

export type ReportReasonId = typeof REPORT_REASONS[number]['id'];

interface MessageModalProps {
  content: string | null;
  bottleId?: string | null;
  isChainFull?: boolean;
  onClose: () => void;
  onReply: () => void;
  onReport?: (bottleId: number, reason: string) => Promise<void>;
}

export default function MessageModal({
  content,
  bottleId,
  isChainFull,
  onClose,
  onReply,
  onReport,
}: MessageModalProps) {
  // Referensi tombol pertama untuk fokus otomatis saat modal terbuka
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [isConfirmingReport, setIsConfirmingReport] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReasonId>('inappropriate_words');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (!content) {
      setIsConfirmingReport(false);
      setSelectedReason('inappropriate_words');
      setIsReporting(false);
      setReportSuccess(false);
      setReportError(null);
      return;
    }

    // Simpan elemen terakhir yang terfokus, lalu pindahkan fokus ke modal
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [content, onClose]);

  if (!content) return null;

  const numericId = bottleId ? parseInt(bottleId, 10) : null;

  const handleExecuteReport = async () => {
    if (!numericId || !onReport) return;
    setIsReporting(true);
    setReportError(null);

    const reasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
    const reasonText = reasonObj ? reasonObj.label : selectedReason;

    try {
      await onReport(numericId, reasonText);
      setReportSuccess(true);
      setIsConfirmingReport(false);
      // Tutup otomatis setelah beberapa detik jika berhasil
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Gagal mengirim laporan.');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="message-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hiasan Stempel / Pita Kecil di atas */}
        <div
          id="message-modal-title"
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 min-w-24 px-4 h-7 bg-amber-200/90 rounded-full border border-amber-300 flex items-center justify-center text-[11px] text-amber-900 font-mono tracking-widest uppercase shadow-md whitespace-nowrap"
        >
          {bottleId ? `PESAN #${bottleId}` : 'PESAN'}
        </div>

        <div className="w-full bg-[#fdfbf7] text-slate-800 p-7 sm:p-8 rounded-2xl shadow-2xl border border-amber-200 max-h-[92vh] overflow-y-auto">

        {/* Notifikasi Sukses Laporkan */}
        {reportSuccess ? (
          <div className="my-6 rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center animate-fade-in">
            <span className="text-3xl">🛡️</span>
            <p className="mt-2 font-serif text-lg font-bold text-emerald-900">
              Laporan Terkirim
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Terima kasih. Pesan yang dilaporkan akan ditinjau dan disembunyikan dari aliran sungai.
            </p>
          </div>
        ) : (
          <>
            {/* Isi Surat */}
            <div className="my-4 min-h-[100px] max-h-[220px] overflow-y-auto font-serif text-lg leading-relaxed text-slate-700 italic px-2">
              &ldquo;{content}&rdquo;
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
              {/* Tombol Buka Panel Laporkan */}
              {numericId && onReport && !isConfirmingReport && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingReport(true)}
                  className="flex items-center gap-1 text-[11px] text-red-500/80 hover:text-red-700 transition-colors focus:outline-none underline decoration-dotted"
                  title="Laporkan pesan ini jika mengandung konten yang tidak pantas"
                >
                  <span>🚩</span> Laporkan Pesan
                </button>
              )}

              <span className="ml-auto">
                {bottleId ? `— Botol #${bottleId} di aliran sungai` : '— Dari seseorang'}
              </span>
            </div>

            {/* Panel Pilihan Alasan Laporan */}
            {isConfirmingReport && (
              <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50/80 animate-fade-in">
                <p className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <span>🚩</span> Pilih alasan mengapa pesan ini tidak pantas:
                </p>

                <div className="mt-2.5 flex flex-col gap-1.5">
                  {REPORT_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason.id;
                    return (
                      <label
                        key={reason.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-red-400 bg-red-100/80 text-red-950 font-medium'
                            : 'border-red-100 bg-white/70 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report_reason"
                          value={reason.id}
                          checked={isSelected}
                          onChange={() => setSelectedReason(reason.id)}
                          className="accent-red-600 h-3.5 w-3.5"
                        />
                        <span>{reason.label}</span>
                      </label>
                    );
                  })}
                </div>

                {reportError && (
                  <p className="mt-2 text-[11px] text-red-700 bg-red-100 p-1.5 rounded">
                    ⚠️ {reportError}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2 justify-end pt-2 border-t border-red-200/60">
                  <button
                    type="button"
                    disabled={isReporting}
                    onClick={() => {
                      setIsConfirmingReport(false);
                      setReportError(null);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isReporting}
                    onClick={handleExecuteReport}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-60"
                  >
                    {isReporting ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                        Mengirim Laporan…
                      </>
                    ) : (
                      'Kirim Laporan'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Tombol Aksi Bawah */}
            <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-slate-200">
              {isChainFull && (
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100 text-center italic">
                  Tali pengikat sudah maksimal (5 balasan). Pesan ini tidak bisa dibalas lagi untuk menjaga arus tetap rapi.
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors rounded-lg"
                >
                  Kembali ke Sungai
                </button>
                <button
                  onClick={onReply}
                  disabled={isChainFull}
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white text-sm rounded-lg shadow-md transition-all font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  <span>💬</span> Kirim Balasan
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
