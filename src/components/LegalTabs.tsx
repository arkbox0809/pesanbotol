import Link from 'next/link';
import { ShieldCheck, FileText, ShieldAlert } from 'lucide-react';

type TabKey = 'privacy' | 'delete' | 'standar-keselamatan';

const TABS: {
  key: TabKey;
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number }>;
}[] = [
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
  {
    key: 'standar-keselamatan',
    label: 'Standar Keselamatan Anak',
    href: '/standar-keselamatan',
    Icon: ShieldAlert,
  },
];

export function LegalTabs({ activeTab = 'privacy' }: { activeTab?: TabKey } = {}) {
  return (
    <nav aria-label="Navigasi halaman hukum" className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              Halaman Hukum PesanBotol
            </p>
          </div>
          <div className="flex lg:flex-row items-center justify-between gap-1 border rounded-xl border-slate-200 bg-white/50 px-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const Icon = tab.Icon;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-sky-50 text-sky-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  title={tab.label}
                >
                  <Icon size={17} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
