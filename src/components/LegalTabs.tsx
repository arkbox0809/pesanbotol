import Link from 'next/link';
import { ShieldCheck, FileText } from 'lucide-react';

type TabKey = 'privacy' | 'delete';

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
          <div className="grid grid-cols-2 border rounded-xl border-slate-200">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const Icon = tab.Icon;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  title={tab.label}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
