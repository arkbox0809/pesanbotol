'use client';

import { useEffect, useRef } from 'react';
import { BookOpen, Heart, X } from 'lucide-react';
import type { BottleRow, BottleType } from '@/lib/supabase';

const BOTTLE_TYPE_LABELS: Record<BottleType, string> = {
  glass: 'Botol Kaca',
  scroll: 'Gulungan Surat',
  anchor: 'Botol Emas (Anchor Bottle)',
  crystal: 'Botol Kristal Malam',
  jade: 'Botol Giok Laut Dalam',
  lantern: 'Botol Lentera Kertas',
};

interface MemoryArchiveModalProps {
  hasArchiveAccess: boolean;
  messages: BottleRow[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onOpenSupport: () => void;
}

export default function MemoryArchiveModal({
  hasArchiveAccess,
  messages,
  isLoading,
  error,
  onClose,
  onOpenSupport,
}: MemoryArchiveModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-archive-title"
      aria-describedby="memory-archive-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <section
        className="relative w-full max-w-md rounded-2xl border border-amber-200 bg-[#fdfbf7] p-6 text-slate-800 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Tutup Peti Kenangan"
          title="Tutup"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-slate-500 transition-colors hover:bg-amber-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
          <BookOpen size={21} aria-hidden="true" />
        </span>
        <h2 id="memory-archive-title" className="mt-4 font-serif text-2xl font-bold">
          Peti Kenangan
        </h2>
        <p id="memory-archive-description" className="mt-2 text-sm leading-relaxed text-slate-600">
          {hasArchiveAccess
            ? 'Riwayat botol yang kamu hanyutkan dari perangkat ini.'
            : 'Peti Kenangan menyimpan riwayat pesan yang kamu hanyutkan. Fitur ini eksklusif untuk pendukung arus.'}
        </p>

        {hasArchiveAccess ? (
          <div className="mt-5">
            {isLoading && <p className="py-6 text-center text-sm text-slate-500">Mengumpulkan pesanmu…</p>}
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {!isLoading && !error && messages.length === 0 && (
              <p className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                Belum ada botol dari perangkat ini. Pesan yang kamu hanyutkan nanti akan tersimpan di sini.
              </p>
            )}
            {!isLoading && !error && messages.length > 0 && (
              <ul className="max-h-[45vh] divide-y divide-slate-200 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {messages.map((message) => (
                  <li key={message.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase text-amber-700">
                        {BOTTLE_TYPE_LABELS[message.bottle_type]}
                      </span>
                      <time className="shrink-0 text-[10px] text-slate-400" dateTime={message.created_at}>
                        {new Date(message.created_at).toLocaleDateString('id-ID')}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words font-serif text-sm leading-relaxed text-slate-700">
                      {message.content.replace(/^Balasan untuk\s+\d+:\s*/i, '')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-900"
              >
                Kembali ke sungai
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-1 py-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              Kembali ke sungai
            </button>
            <button
              type="button"
              onClick={onOpenSupport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            >
              <Heart size={15} aria-hidden="true" />
              Dukung Arus
            </button>
          </div>
        )}
      </section>
    </div>
  );
}