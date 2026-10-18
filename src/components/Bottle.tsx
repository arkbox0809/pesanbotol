import React, { useMemo, useState } from 'react';
import { Anchor as AnchorIcon, Gem, Leaf, Sparkles } from 'lucide-react';
import type { BottleType } from '@/lib/supabase';

type BottleVisualType = BottleType;

const BOTTLE_TYPE_LABELS: Record<BottleVisualType, string> = {
  glass: 'Botol Kaca',
  scroll: 'Gulungan Surat',
  anchor: 'Botol Emas Abadi',
  crystal: 'Botol Kristal Malam',
  jade: 'Botol Giok Laut Dalam',
  lantern: 'Botol Lentera Kertas',
};

export interface BottleProps {
  id: string;
  content: string;
  bottleType: BottleVisualType;
  replyToId?: number | null;
  parentBottle?: {
    id: number;
    content: string;
    bottle_type: BottleVisualType;
  } | null;
  linkedReplies?: {
    id: number;
    content: string;
    bottle_type: BottleVisualType;
    children?: {
      id: number;
      content: string;
      bottle_type: BottleVisualType;
    }[];
  }[];
  onOpen: (content: string, bottleId?: string) => void;
  isMention?: boolean;
}

export default function Bottle({
  id,
  content,
  bottleType,
  replyToId,
  parentBottle,
  linkedReplies = [],
  onOpen,
  isMention = false,
}: BottleProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Gunakan ID botol untuk menentukan nilai dasar
  const numericId = parseInt(id, 10) || 1;
  const isChained = Boolean((replyToId && parentBottle) || linkedReplies.length > 0);
  const baseId = isChained && parentBottle ? parentBottle.id : numericId;

  // Nilai acak stabil berbasis ID unik botol:
  // Ketinggian dan kecepatan terdistribusi acak & bervariasi luas di sungai
  const trajectory = useMemo(() => {
    // Multiplier hash deterministik
    const h1 = (baseId * 2654435761) >>> 0;
    const h2 = (baseId * 1597334677) >>> 0;

    // Ketinggian (top): tersebar merata & acak antara 12% dan 82% layar
    const rawTop = 12 + (h1 % 71);
    const topPercent = isChained ? rawTop + 3 : rawTop;

    // Kecepatan (durasi lintas): bervariasi acak antara 20 detik sampai 38 detik
    const duration = 20 + (h2 % 19);

    // Kecepatan riak ombak naik-turun (2.2s - 3.8s)
    const bobSpeed = 2.2 + ((h1 >> 8) % 17) * 0.1;

    // Delay awal negatif agar botol langsung tersebar di sungai saat halaman dimuat
    // tanpa menunggu muncul dari sisi kanan
    const initialDelay = -(((baseId * 6.3) + ((h2 >> 4) % 11)) % (duration - 2));

    return {
      topPercent,
      duration,
      bobSpeed,
      initialDelay,
    };
  }, [baseId, isChained]);

  // Render SVG untuk botol tunggal (kaca atau gulungan)
  const renderBottleIcon = (type: BottleVisualType, isChainMember = false) => {
    if (type === 'anchor' && !isChainMember) {
      return (
        <div className="relative isolate h-10 w-[68px] drop-shadow-[0_0_10px_rgba(251,191,36,0.75)]">
          <span className="absolute inset-1 z-0 rounded-full bg-amber-300/50 blur-md animate-pulse" />
          <svg
            width="68"
            height="40"
            viewBox="0 0 85 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 rotate-[-12deg]"
            aria-hidden="true"
          >
            <rect x="4" y="21" width="10" height="8" rx="2" fill="#92400e" stroke="#fcd34d" strokeWidth="1" />
            <path d="M13 20L24 16V34L13 30Z" fill="rgba(251,191,36,0.34)" stroke="#fde68a" strokeWidth="1.2" />
            <rect x="23" y="10" width="54" height="30" rx="14" fill="rgba(253,230,138,0.48)" stroke="#fbbf24" strokeWidth="1.8" />
            <path d="M29 15Q49 11 70 15" stroke="#fff7cc" strokeWidth="2" strokeLinecap="round" />
            <path d="M31 35Q50 38 68 35" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" />
            <rect x="30" y="18" width="38" height="14" rx="3" fill="#fff7ed" stroke="#d97706" strokeWidth="0.8" />
          </svg>
          <AnchorIcon size={15} strokeWidth={2.2} className="absolute left-[42px] top-[13px] z-20 text-amber-900" aria-hidden="true" />
          <Sparkles size={13} className="absolute right-0 top-0 z-20 text-amber-100 animate-pulse" aria-hidden="true" />
        </div>
      );
    }

    if (type === 'crystal') {
      return (
        <div className="relative isolate h-10 w-[68px] drop-shadow-[0_0_11px_rgba(96,165,250,0.75)]">
          <span className="absolute inset-1 z-0 rounded-full bg-blue-500/35 blur-md" />
          <svg width="68" height="40" viewBox="0 0 85 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 rotate-[-12deg]" aria-hidden="true">
            <rect x="4" y="21" width="10" height="8" rx="2" fill="#172554" stroke="#93c5fd" strokeWidth="1" />
            <path d="M13 20L24 16V34L13 30Z" fill="rgba(30,58,138,0.72)" stroke="#bfdbfe" strokeWidth="1.2" />
            <rect x="23" y="10" width="54" height="30" rx="14" fill="rgba(15,23,42,0.82)" stroke="#60a5fa" strokeWidth="1.8" />
            <path d="M30 14L42 36L50 13L61 36L70 15" stroke="#bfdbfe" strokeWidth="1.3" fill="rgba(30,64,175,0.28)" />
            <path d="M28 16Q49 12 70 15" stroke="#eff6ff" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="37" cy="23" r="1.2" fill="#fff" />
            <circle cx="57" cy="29" r="1" fill="#dbeafe" />
            <circle cx="66" cy="20" r="0.8" fill="#fff" />
          </svg>
          <Sparkles size={13} className="absolute right-0 top-0 z-20 text-blue-100" aria-hidden="true" />
        </div>
      );
    }

    if (type === 'jade') {
      return (
        <div className="relative isolate h-10 w-[68px] drop-shadow-[0_0_10px_rgba(16,185,129,0.58)]">
          <span className="absolute inset-1 z-0 rounded-full bg-emerald-500/30 blur-md" />
          <svg width="68" height="40" viewBox="0 0 85 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 rotate-[-12deg]" aria-hidden="true">
            <rect x="4" y="21" width="10" height="8" rx="2" fill="#9a3412" stroke="#d6a36a" strokeWidth="1" />
            <path d="M13 20L24 16V34L13 30Z" fill="rgba(6,78,59,0.75)" stroke="#b87333" strokeWidth="1.2" />
            <rect x="23" y="10" width="54" height="30" rx="14" fill="rgba(6,78,59,0.88)" stroke="#b87333" strokeWidth="1.8" />
            <path d="M29 15Q49 11 70 15" stroke="#a7f3d0" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M30 35Q50 38 69 35" stroke="rgba(184,115,51,0.85)" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M42 19Q50 15 57 21Q53 29 45 30Q40 26 42 19Z" fill="#10b981" stroke="#d6a36a" strokeWidth="1" />
          </svg>
          <Leaf size={13} className="absolute right-0 top-0 z-20 text-emerald-200" aria-hidden="true" />
        </div>
      );
    }

    if (type === 'lantern') {
      return (
        <div className="relative isolate flex h-12 w-9 items-center justify-center drop-shadow-[0_0_12px_rgba(251,191,36,0.72)]">
          <span className="absolute inset-1 z-0 rounded-full bg-amber-400/45 blur-md" />
          <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10" aria-hidden="true">
            <path d="M11 4H25V8H11Z" fill="#92400e" stroke="#fcd34d" />
            <path d="M9 10Q18 6 27 10L25 37Q18 42 11 37Z" fill="rgba(251,191,36,0.58)" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M14 9L15 38M22 9L21 38" stroke="#b45309" strokeWidth="1.5" />
            <path d="M10 14H26M10.5 33H25.5" stroke="#fde68a" strokeWidth="1.2" />
            <path d="M13 40H23L20 44H16Z" fill="#92400e" stroke="#fbbf24" />
            <path d="M18 1V4" stroke="#fcd34d" strokeWidth="1.5" />
          </svg>
          <Sparkles size={12} className="absolute -right-1 top-0 z-20 text-amber-100" aria-hidden="true" />
        </div>
      );
    }

    if (type !== 'scroll') {
      return (
        <div className="relative filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
          <svg
            width="68"
            height="40"
            viewBox="0 0 85 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform rotate-[-12deg]"
          >
            {/* Tutup Gabus (Cork) */}
            <rect x="4" y="21" width="10" height="8" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            <line x1="6" y1="21" x2="6" y2="29" stroke="#92400e" strokeWidth="0.8" />
            <line x1="9" y1="21" x2="9" y2="29" stroke="#92400e" strokeWidth="0.8" />

            {/* Leher Botol */}
            <path
              d="M13 20 L24 16 L24 34 L13 30 Z"
              fill="rgba(186, 230, 253, 0.45)"
              stroke="rgba(224, 242, 254, 0.8)"
              strokeWidth="1.2"
            />

            {/* Badan Botol Kaca */}
            <rect
              x="23"
              y="10"
              width="54"
              height="30"
              rx="14"
              fill="rgba(186, 230, 253, 0.35)"
              stroke="rgba(224, 242, 254, 0.85)"
              strokeWidth="1.6"
            />

            {/* Gulungan Kertas di Dalam Botol */}
            <rect
              x="30"
              y="18"
              width="38"
              height="14"
              rx="3"
              fill="#fef3c7"
              stroke="#d97706"
              strokeWidth="0.8"
              strokeDasharray="2 1"
            />
            {/* Pita Pengikat Gulungan */}
            <rect x="46" y="17" width="5" height="16" rx="1" fill="#e11d48" />

            {/* Pantulan / Highlight Kaca */}
            <path
              d="M 28 15 Q 50 13 70 15"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 32 36 Q 50 37 68 36"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    }

    return (
      <div className="relative filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
        <svg
          width="64"
          height="38"
          viewBox="0 0 80 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transform rotate-[-8deg]"
        >
          {/* Gulungan Kertas Kuno */}
          <rect
            x="12"
            y="12"
            width="56"
            height="24"
            rx="6"
            fill="#fef08a"
            stroke="#ca8a04"
            strokeWidth="1.5"
          />
          {/* Ujung Gulungan Kiri & Kanan */}
          <ellipse cx="12" cy="24" rx="4" ry="12" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
          <ellipse cx="68" cy="24" rx="4" ry="12" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />

          {/* Tali Pengikat & Segel Merah */}
          <rect x="37" y="10" width="6" height="28" rx="2" fill="#dc2626" />
          <circle cx="40" cy="24" r="5" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1" />

          {/* Efek Garis Kertas Kuno */}
          <line x1="20" y1="18" x2="33" y2="18" stroke="#ca8a04" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="20" y1="28" x2="33" y2="28" stroke="#ca8a04" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="47" y1="18" x2="60" y2="18" stroke="#ca8a04" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="47" y1="28" x2="60" y2="28" stroke="#ca8a04" strokeWidth="1" strokeDasharray="3 2" />
        </svg>
      </div>
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Buka pesan dalam botol (${linkedReplies.length ? `Rantai dengan ${linkedReplies.length} balasan` : isChained ? 'Dua Botol Terikat Rantai' : BOTTLE_TYPE_LABELS[bottleType]})`}
      className="bottle-float absolute left-0 cursor-pointer outline-none pointer-events-auto group select-none"
      style={{
        '--bottle-base-duration': `${trajectory.duration}s`,
        top: `${trajectory.topPercent}%`,
        animationDelay: `${trajectory.initialDelay}s`,
        animationPlayState: isPaused ? 'paused' : 'running',
        zIndex: isPaused ? 30 : 15,
      } as React.CSSProperties}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => onOpen(content, id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(content, id);
        }
      }}
    >
      {/* Kontainer bobbing (naik-turun mengikuti arus) */}
      <div
        className="transition-transform duration-300 transform group-hover:scale-115 focus-visible:scale-115"
        style={{
          animation: `bottleBob ${trajectory.bobSpeed}s ease-in-out infinite alternate`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
      {/* JIKA TERIKAT DENGAN BOTOL INDUK (CHAIN / TETHERED BOTTLES) */}
      {linkedReplies.length > 0 ? (
        <div className="relative flex w-max items-center">
          {[
            { id: numericId, content, bottle_type: bottleType, isRoot: true, isMention: false },
            ...linkedReplies.flatMap((reply) => [
              { ...reply, isRoot: false, isMention: false },
              ...(reply.children ?? []).map((c) => ({
                id: c.id,
                content: c.content,
                bottle_type: c.bottle_type,
                isRoot: false,
                isMention: false,
                parentId: reply.id,
              })),
            ]),
          ].map((message, index) => (
            <React.Fragment key={message.id}>
              <div
                className="relative flex w-[60px] shrink-0 items-center justify-center transition-transform duration-200 hover:scale-110"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(message.content, String(message.id));
                }}
                title={message.isRoot ? 'Klik untuk membuka pesan induk' : 'Klik untuk membuka balasan'}
              >
                {index > 0 && (
                  <div className="absolute left-[-18px] top-1/2 z-10 flex h-6 w-9 -translate-y-1/2 items-center justify-center">
                    <svg width="36" height="24" viewBox="0 0 36 24" fill="none" aria-hidden="true">
                      <path d="M 2 12 Q 18 20 34 12" stroke="rgba(251,191,36,0.4)" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 2 12 Q 18 20 34 12" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 2" strokeLinecap="round" className="animate-tether-flow" />
                      <circle cx="2" cy="12" r="2.5" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
                      <circle cx="34" cy="12" r="2.5" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
                    </svg>
                  </div>
                )}
                <div className="relative z-20">
                  {renderBottleIcon(message.bottle_type, true)}
                  {message.isMention && (
                    <div className="absolute top-0 right-0 z-30 flex h-4 w-4 items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 drop-shadow-[0_0_4px_rgba(0,0,0,0.4)]">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6M12 18v-6" />
                        <path d="M6 12h6" />
                      </svg>
                      <span className="absolute -top-1 -right-1 z-40 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="pointer-events-none absolute -bottom-1 h-2.5 w-11 rounded-full bg-amber-300/20 blur-[2px]" />
                <span className={`absolute -top-4 whitespace-nowrap rounded-full border px-1 py-0.5 text-[8px] font-mono font-bold ${
                  message.isRoot
                    ? 'border-amber-300/30 bg-slate-900/80 text-amber-200/90'
                    : 'border-sky-300/40 bg-sky-950/80 text-sky-200/90'
                }`}>
                  {message.isRoot ? `Induk #${message.id}` : `Balasan #${message.id}`}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      ) : isChained && parentBottle ? (
          <div className="relative flex items-center">
            {/* 1. Botol Induk (Pesan Awal) */}
            <div
              className="relative transition-transform duration-200 hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(parentBottle.content, String(parentBottle.id));
              }}
              title="Klik untuk membuka pesan awal"
            >
              {renderBottleIcon(parentBottle.bottle_type, true)}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-2.5 bg-sky-300/20 rounded-full blur-[2px] animate-pulse pointer-events-none" />
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-amber-200/90 bg-slate-900/80 px-1.5 py-0.5 rounded-full border border-amber-300/30 whitespace-nowrap">
                Pesan #{parentBottle.id}
              </span>
            </div>

            {/* 2. Visual Rantai Pengikat / Tali Emas Glowing */}
            <div className="relative -mx-3 z-10 flex items-center justify-center">
              <svg width="60" height="26" viewBox="0 0 60 26" fill="none" className="overflow-visible">
                {/* Cahaya glow di belakang tali */}
                <path
                  d="M 6 13 Q 30 22 54 13"
                  stroke="rgba(251, 191, 36, 0.4)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="filter blur-[2px]"
                />
                {/* Tali tambang / rantai utama dengan riak dinamis */}
                <path
                  d="M 6 13 Q 30 22 54 13"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  className="animate-tether-flow"
                />
                {/* Simpul rantai / cincin di ujung kiri & kanan */}
                <circle cx="6" cy="13" r="3.5" stroke="#fbbf24" strokeWidth="2" fill="#78350f" />
                <circle cx="54" cy="13" r="3.5" stroke="#fbbf24" strokeWidth="2" fill="#78350f" />
                {/* Ikon Ikatan Hati / Simpul Tengah */}
                <g transform="translate(25, 12)">
                  <circle cx="5" cy="5" r="4.5" fill="#ef4444" stroke="#fef08a" strokeWidth="1" />
                  <path d="M 3.5 4 Q 5 2.5 6.5 4 Q 6.5 5.5 5 7 Q 3.5 5.5 3.5 4 Z" fill="#ffffff" />
                </g>
              </svg>
            </div>

            {/* 3. Botol Balasan (Pesan Ini) */}
            <div
              className="relative transition-transform duration-200 hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(content, id);
              }}
              title="Klik untuk membuka pesan balasan"
            >
              {renderBottleIcon(bottleType, true)}
              {isMention && (
                <div className="absolute top-0 right-0 z-30 flex h-4 w-4 items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 drop-shadow-[0_0_4px_rgba(0,0,0,0.4)]">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6M12 18v-6" />
                    <path d="M6 12h6" />
                  </svg>
                  <span className="absolute -top-1 -right-1 z-40 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
              )}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-2.5 bg-amber-300/25 rounded-full blur-[2px] animate-pulse pointer-events-none" />
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-sky-200/90 bg-sky-950/80 px-1.5 py-0.5 rounded-full border border-sky-300/40 whitespace-nowrap">
                {isMention ? '📎 Mention' : '💬 Balasan'}
              </span>
            </div>
          </div>
        ) : (
          /* JIKA BOTOL BIASA / MANDIRI */
          <div className="relative">
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-sky-300/20 rounded-full blur-[2px] animate-pulse pointer-events-none" />
            {renderBottleIcon(bottleType)}
          </div>
        )}

        {/* Tooltip / Petunjuk saat diarahkan kursor */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 pointer-events-none z-40">
          <span className="px-3 py-1 text-[11px] font-sans font-medium text-amber-100 bg-slate-900/95 border border-amber-300/50 rounded-full shadow-xl backdrop-blur-md flex items-center gap-1.5">
            {bottleType === 'anchor' && !isChained ? (
              <>
                <Sparkles size={13} className="text-amber-300" aria-hidden="true" /> Anchor Bottle Abadi
              </>
            ) : linkedReplies.length > 0 ? (
              <>
                <span className="text-amber-400">🔗</span> {linkedReplies.length} Balasan Terikat
              </>
            ) : isChained ? (
              <>
                <span className="text-amber-400">🔗</span> Dua Botol Terikat Rantai
              </>
            ) : (
              <>
                <span>✨</span> Buka Pesan
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
