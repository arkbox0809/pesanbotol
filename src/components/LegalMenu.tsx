'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Menu,
  ShieldAlert,
  ShieldCheck,
  FileText,
} from 'lucide-react';

type LegalItem = {
  key: string;
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const LEGAL_ITEMS: LegalItem[] = [
  {
    key: 'standar-keselamatan',
    label: 'Standar Keselamatan Anak',
    href: '/standar-keselamatan',
    Icon: ShieldAlert,
  },
  {
    key: 'privacy',
    label: 'Kebijakan Privasi',
    href: '/privacy-policy',
    Icon: ShieldCheck,
  },
  {
    key: 'delete',
    label: 'Hapus Akun',
    href: '/delete-account',
    Icon: FileText,
  },
];

export default function LegalMenu() {
  const [isOpen, setIsOpen] = useState(false);

  function handleToggle() {
    setIsOpen((prev) => !prev);
  }

  return (
    <div className="relative inline-block">
      {/* Tombol burger */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Menu halaman hukum"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none"
      >
        <Menu size={18} />
      </button>

      {/* Panel halaman hukum */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-[#fdfbf7] p-3 shadow-2xl z-50 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              Halaman Hukum
            </span>
          </div>
          <div className="space-y-1">
            {LEGAL_ITEMS.map((item) => {
              const Icon = item.Icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-700 transition-colors"
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
