'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';

interface MobileMenuProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileMenu({ children, isOpen, onOpenChange }: MobileMenuProps) {
  // Tutup panel saat menekan Escape
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [onOpenChange]);

  return (
    <>
      {/* Tombol hamburger tetap berada di dalam navbar (tidak di-portal).
          Hanya muncul di mobile (<1024px / lg:). */}
      <button
        type="button"
        aria-label="Buka menu navigasi"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="lg:hidden z-50 rounded-full border border-slate-200/80 bg-[#fdfbf7]/95 p-2 text-slate-700 shadow-lg backdrop-blur-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        onClick={() => onOpenChange(!isOpen)}
      >
        {isOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
      </button>

      {/* Overlay backdrop dan panel menu di-portal ke document.body sehingga
           tidak terperangkap di stacking context / overflow-hidden navbar
           atau elemen lain di halaman (botol, tombol arsip, streak toast, dst). */}
      {isOpen &&
        createPortal(
          <>
            {/* Backdrop — z-index lebih rendah, berada di belakang panel */}
            <div
              className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[9998]"
              aria-hidden="true"
              onClick={() => onOpenChange(false)}
            />
            {/* Kontainer panel menu — z-index tepat di atas backdrop,
                 dan di luar stacking context halaman agar tidak terpotong
                 atau dilemahkan oleh elemen UI lain. */}
            <div className="fixed inset-0 z-[999999] flex flex-col">
              <div className="w-full max-w-md mx-auto mt-6">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/20 bg-[#fdfbf7]/95">
                  <h2 className="text-lg font-serif font-bold text-slate-900">Menu</h2>
                  <button
                    type="button"
                    aria-label="Tutup menu"
                    className="text-slate-400 hover:text-slate-900 focus:outline-none"
                    onClick={() => onOpenChange(false)}
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                </div>
                <nav
                  className="flex-1 px-6 py-5 overflow-y-auto"
                  onClick={() => onOpenChange(false)}
                >
                  <div className="flex flex-col gap-1">{children}</div>
                </nav>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
