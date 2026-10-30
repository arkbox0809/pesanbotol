'use client';

import Bottle from '@/components/bottle';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Compass,
  Heart,
  PenLine,
} from 'lucide-react';
import {
  getBottlesByOcean,
  getOceanLabel,
  reportBottle,
  supabase,
  type BottleRow,
} from '@/lib/supabase';
import { getDeviceToken } from '@/lib/auth';
import MessageModal from '@/components/MessageModal';
import MemoryArchiveModal from '@/components/MemoryArchiveModal';
import NotificationBell from '@/components/NotificationBell';
import SupportModal from '@/components/SupportModal';

const MAX_VISIBLE_BOTTLES = 75;
const MAX_CHAIN_REPLIES = 5;
const MAX_CHAIN_DEPTH = 5;
const FEED_TIMEOUT_MS = 12000;

type ChainStats = {
  rootId: number;
  depth: number;
  parentId: number | null;
  isMention: boolean;
  mentionTargetId: number | null;
};

const OCEAN_BACKGROUNDS: Record<string, string> = {
  'Laut-Senja':
    'bg-gradient-to-b from-amber-900 via-purple-950 to-slate-950 min-h-screen',
  'Lautan-Harapan':
    'bg-gradient-to-b from-blue-950 via-indigo-900 to-slate-950 min-h-screen',
  'Telaga-Senyap':
    'bg-gradient-to-b from-cyan-900 via-teal-950 to-slate-950 min-h-screen',
  'default':
    'bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 min-h-screen',
};

const OCEAN_TEXT_COLOR: Record<string, string> = {
  'Laut-Senja': 'text-amber-100',
  'Lautan-Harapan': 'text-blue-100',
  'Telaga-Senyap': 'text-cyan-100',
};

function getFeedErrorMessage(error: unknown, timedOut: boolean): string {
  if (timedOut) {
    return 'Koneksi ke sungai terlalu lama. Periksa jaringan lalu coba muat ulang.';
  }

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : '';

  if (/failed to fetch|fetch failed|typeerror|networkerror|network error/i.test(errorMessage)) {
    return 'Tidak dapat terhubung ke database. Periksa koneksi internet lalu coba lagi.';
  }
  return errorMessage || 'Gagal memuat botol dari database. Silakan coba lagi.';
}

export function OceanFeed({ ocean }: { ocean: string }) {
  const [bottles, setBottles] = useState<BottleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [deviceToken, setDeviceTokenState] = useState<string | null>(null);
  const [archiveMessages, setArchiveMessages] = useState<BottleRow[]>([]);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [selectedMessage, setSelectedMessage] = useState<{
    content: string;
    id: string;
    replyCount: number;
  } | null>(null);

  const handleOpenBottle = (content: string, bottleId: string): void => {
    const id = parseInt(bottleId, 10);
    setSelectedMessage({
      content,
      id: bottleId,
      replyCount: replyCounts.get(id) ?? 0,
    });
  };

  const oceanLabel = getOceanLabel(ocean);
  const oceanBg = OCEAN_BACKGROUNDS[ocean] ?? OCEAN_BACKGROUNDS['default'];
  const oceanText = OCEAN_TEXT_COLOR[ocean] ?? OCEAN_TEXT_COLOR['Lautan-Harapan'];

  useEffect(() => {
    setDeviceTokenState(getDeviceToken());
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
    setIsLoading(true);
    setFetchError(null);

    async function loadBottles() {
      try {
        const data = await getBottlesByOcean(ocean || undefined);
        if (!isCancelled) {
          setBottles(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setFetchError(getFeedErrorMessage(err, controller.signal.aborted));
        }
      } finally {
        if (!isCancelled) {
          window.clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    }

    loadBottles();

    return () => {
      isCancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [ocean, loadAttempt]);

  const handleReport = async (bottleId: number, reason: string) => {
    const result = await reportBottle(bottleId, reason);
    if (result.isHidden) {
      // Sembunyikan langsung dari daftar botol yang sedang berlayar di sungai
      setBottles((prev) => prev.filter((b) => b.id !== bottleId));
    }
  };

  const visibleBottles = bottles.filter((b) => !b.is_hidden);

  // --- Analisis rantai balasan ---
  const bottleMap = useMemo(() => new Map(bottles.map((b) => [b.id, b])), [bottles]);

  const chainAnalysis = useMemo(() => {
    const chains = new Map<number, ChainStats>();

    const getChainStats = (id: number): ChainStats => {
      if (chains.has(id)) return chains.get(id)!;
      const bottle = bottleMap.get(id);
      if (!bottle) {
        return { rootId: id, depth: 1, parentId: null, isMention: false, mentionTargetId: null };
      }

      const match = bottle.content.match(/^Balasan untuk\s+(\d+):/i);
      if (match && bottleMap.has(parseInt(match[1], 10))) {
        const parentId = parseInt(match[1], 10);
        const parentStats: ChainStats = getChainStats(parentId);
        if (parentStats.depth >= MAX_CHAIN_DEPTH) {
          const stats: ChainStats = {
            rootId: parentStats.rootId,
            depth: 1,
            parentId: null,
            isMention: true,
            mentionTargetId: parentId,
          };
          chains.set(id, stats);
          return stats;
        }
        const stats: ChainStats = {
          rootId: parentStats.rootId,
          depth: parentStats.depth + 1,
          parentId,
          isMention: parentStats.isMention,
          mentionTargetId: null,
        };
        chains.set(id, stats);
        return stats;
      }

      const stats: ChainStats = {
        rootId: id,
        depth: 1,
        parentId: null,
        isMention: false,
        mentionTargetId: null,
      };
      chains.set(id, stats);
      return stats;
    };

    bottles.forEach((b) => getChainStats(b.id));
    return { chains };
  }, [bottles, bottleMap]);

  const bottleChains = chainAnalysis.chains;

  const childrenMap = useMemo(() => {
    const map = new Map<number, BottleRow[]>();
    bottles.forEach((bottle) => {
      const parentId = bottleChains.get(bottle.id)?.parentId;
      if (parentId) {
        const children = map.get(parentId) ?? [];
        children.push(bottle);
        map.set(parentId, children);
      }
    });
    for (const [, children] of map) {
      children.sort((a, b) => a.created_at.localeCompare(b.created_at));
      children.splice(MAX_CHAIN_REPLIES);
    }
    return map;
  }, [bottles, bottleChains]);

  const childIds = useMemo(() => {
    const ids = new Set<number>();
    childrenMap.forEach((children) => children.forEach((c) => ids.add(c.id)));
    return ids;
  }, [childrenMap]);

  const replyCounts = useMemo(() => {
    const counts = new Map<number, number>();
    bottles.forEach((bottle) => {
      const parentId = bottleChains.get(bottle.id)?.parentId;
      if (parentId) counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
    });
    return counts;
  }, [bottles, bottleChains]);

  const fullChainBottleIds = useMemo(() => {
    const ids = new Set<number>();
    replyCounts.forEach((count, parentId) => {
      if (count >= MAX_CHAIN_REPLIES) ids.add(parentId);
    });
    return ids;
  }, [replyCounts]);

  const replyGroups = useMemo(() => {
    return bottles
      .filter((bottle) => !bottle.is_hidden && bottleChains.get(bottle.id)?.parentId === null)
      .map((root) => {
        const replies = (childrenMap.get(root.id) ?? [])
          .filter((reply) => !reply.is_hidden)
          .sort((a, b) => a.created_at.localeCompare(b.created_at));
        return {
          root,
          replies,
          linkedReplies: replies.slice(0, MAX_CHAIN_REPLIES).map((reply) => ({
            id: reply.id,
            content: reply.content,
            bottle_type: reply.bottle_type,
            children: childrenMap.get(reply.id) ?? [],
            isMention: Boolean(bottleChains.get(reply.id)?.isMention),
          })),
        };
      });
  }, [bottles, bottleChains, childrenMap]);

  const groupedBottleIds = useMemo(() => {
    const ids = new Set<number>();
    replyGroups.forEach(({ root, linkedReplies }) => {
      ids.add(root.id);
      linkedReplies.forEach((reply) => {
        ids.add(reply.id);
        reply.children.forEach((r) => ids.add(r.id));
      });
    });
    return ids;
  }, [replyGroups]);

  const renderableBottles = useMemo(() => {
    const rendered = new Set<number>();
    replyGroups.forEach(({ root, linkedReplies }) => {
      rendered.add(root.id);
      linkedReplies.forEach((reply) => rendered.add(reply.id));
    });
    visibleBottles.forEach((bottle) => {
      if (!rendered.has(bottle.id)) rendered.add(bottle.id);
    });
    return [...rendered]
      .map((id) => bottleMap.get(id)!)
      .filter((b): b is BottleRow => Boolean(b))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, MAX_VISIBLE_BOTTLES)
      .map((b) => b.id);
  }, [replyGroups, visibleBottles, bottleMap]);

  const handleOpenArchive = async () => {
    setIsArchiveOpen(true);
    setArchiveError(null);
    const token = deviceToken;
    if (!token) {
      setArchiveError('Token perangkat tidak tersedia. Aktifkan penyimpanan browser untuk membuka arsip.');
      return;
    }
    if (!supabase) {
      setArchiveError('Koneksi Supabase belum dikonfigurasi.');
      return;
    }
    setIsArchiveLoading(true);
    try {
      const { data, error } = await supabase
        .from('bottles')
        .select('*')
        .eq('owner_token', token)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setArchiveMessages((data as BottleRow[]) ?? []);
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : 'Gagal memuat Peti Kenangan.');
    } finally {
      setIsArchiveLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-screen h-screen overflow-hidden select-none {oceanBg}">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle, #1e293b 0%, #0f172a 100%)]" />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-200">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
            <p className="font-mono text-xs tracking-wide">Mencari botol di {oceanLabel}…</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="relative w-screen h-screen overflow-hidden select-none {oceanBg}">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle, #1e293b 0%, #0f172a 100%)]" />
        <div className="absolute inset-x-0 top-16 z-20 flex justify-center px-4">
          <p className="max-w-md rounded-md border border-slate-700/40 bg-slate-900/50 px-4 py-2 text-center text-xs text-slate-200 backdrop-blur-sm">
            ⚠️ {fetchError}
            <button
              type="button"
              onClick={() => setLoadAttempt((a) => a + 1)}
              className="ml-2 underline decoration-dotted underline-offset-2 hover:text-slate-100"
            >
              Coba lagi
            </button>
          </p>
        </div>
      </div>
    );
  }

  const hasBottles = visibleBottles.length > 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none {oceanBg}">
      {/* Latar belakang laut dengan tema gelap */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle, #1e293b 0%, #0f172a 100%)]" />
      {/* Gradasi gelap di tepi atas dan bawah laut */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[inherit]/80 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[inherit]/80 to-transparent pointer-events-none" />

      {/* Efek arus laut halus (bukan bintik-bintik putih) */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] animate-wave pointer-events-none" />

      {/* Laut Senja: efek kilau senja sore */}
      {ocean === 'Laut-Senja' && (
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#fbbf24_15%,transparent_60%)] animate-[pulse_4s_ease-in-out_infinite]" />
      )}

      {/* Telaga Senyap: daun-daun yang melayang mengikuti arus */}
      {ocean === 'Telaga-Senyap' && (
        <>
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,#bae6fd_15%,transparent_60%)] animate-[pulse_5s_ease-in-out_infinite]" />
          <div className="absolute top-1/4 left-10 w-5 h-2 rounded-full bg-emerald-400/80 animate-[floatLeaf_6s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
          <div className="absolute top-1/3 right-20 w-6 h-3 rounded-full bg-emerald-300/70 animate-[floatLeaf_8s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
          <div className="absolute top-2/5 left-40 w-4 h-2 rounded-full bg-emerald-200/60 animate-[floatLeaf_7s_ease-in-out_infinite]" style={{ animationDelay: '4s' }} />
          <div className="absolute top-3/5 right-10 w-5 h-2.5 rounded-full bg-emerald-400/80 animate-[floatLeaf_9s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
          <div className="absolute top-4/5 left-60 w-4 h-2 rounded-full bg-emerald-300/70 animate-[floatLeaf_6s_ease-in-out_infinite]" style={{ animationDelay: '3s' }} />
          <style>
            {`
              @keyframes floatLeaf {
                0% { transform: translateX(110vw) translateY(0) rotate(0deg); opacity: 0; }
                10% { opacity: 0.8; }
                90% { opacity: 0.8; }
                100% { transform: translateX(-20vw) translateY(60px) rotate(360deg); opacity: 0; }
              }
            `}
          </style>
        </>
      )}

      {/* Judul / Header di pojok kiri */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-1">
        <h1 className={`font-serif text-2xl font-bold tracking-wider drop-shadow-md ${oceanText}`}>
          {oceanLabel}
        </h1>
        <p className="text-xs font-mono tracking-wide text-white/70">
          Cabang laut PesanBotol
        </p>
      </div>

      {/* Tombol navigasi di pojok kanan */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <NotificationBell
          onReplyClick={() => {
            // Tidak ada highlight di halaman explore
          }}
        />
        <button
          type="button"
          aria-label="Dukung Arus"
          aria-haspopup="dialog"
          aria-expanded={isSupportOpen}
          title="Dukung Arus"
          onClick={() => setIsSupportOpen(true)}
          className="flex items-center justify-center gap-2 rounded-full border border-sky-200/50 bg-sky-100/90 p-2.5 text-sm font-medium text-sky-950 shadow-lg backdrop-blur-sm transition-colors hover:bg-sky-50 lg:px-4 lg:py-2.5"
        >
          <Heart size={18} aria-hidden="true" />
          <span className="hidden lg:inline">Dukung Arus</span>
        </button>
        <Link
          href="/write"
          aria-label="Hanyutkan Pesan"
          title="Hanyutkan Pesan"
          className="flex items-center justify-center gap-2 rounded-full border border-amber-300/50 bg-amber-500/90 p-2.5 text-sm font-medium text-slate-900 shadow-lg backdrop-blur-sm transition-all hover:bg-amber-500 lg:px-5 lg:py-2.5"
        >
          <PenLine size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="hidden lg:inline">Hanyutkan Pesan</span>
        </Link>
        <Link
          href="/explore"
          aria-label="Kembali ke Daftar Laut"
          title="Kembali ke Daftar Laut"
          className="flex items-center justify-center gap-2 rounded-full border border-slate-200/50 bg-slate-100/90 p-2.5 text-sm font-medium text-slate-900 shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-200 lg:px-4 lg:py-2.5"
        >
          <Compass size={18} aria-hidden="true" />
          <span className="hidden lg:inline">Kembali</span>
        </Link>
      </div>

      {/* Tombol Peti Kenangan di bawah tengah */}
      <button
        type="button"
        aria-label="Buka Peti Kenangan"
        title="Peti Kenangan"
        onClick={handleOpenArchive}
        className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-amber-200/80 bg-[#fdfbf7]/95 p-3 text-amber-900 shadow-lg backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:px-4"
      >
        <BookOpen size={19} aria-hidden="true" />
        <span className="hidden text-sm font-medium sm:inline">Peti Kenangan</span>
      </button>

      {/* Status counter di pojok kanan bawah */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1 rounded-full border border-slate-200/80 bg-[#fdfbf7]/90 p-2 px-3 text-xs font-mono text-slate-700 shadow-lg backdrop-blur-sm">
        {visibleBottles.length}/{MAX_VISIBLE_BOTTLES} botol di {oceanLabel}
      </div>

      {/* Kondisi kosong */}
      {!isLoading && !fetchError && !hasBottles && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <p className="max-w-sm text-center font-serif text-lg italic leading-relaxed text-white/80">
            {oceanLabel} masih kosong. Jadilah yang pertama menghanyutkan pesan di sini.
          </p>
        </div>
      )}

      {/* Sungai botol */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {!isLoading &&
          replyGroups
            .filter(
              ({ root, linkedReplies }) =>
                renderableBottles.includes(root.id) ||
                linkedReplies.some((r) => renderableBottles.includes(r.id))
            )
            .map(({ root, replies, linkedReplies }) => (
              <Bottle
                key={`reply-group-${root.id}`}
                id={String(root.id)}
                content={root.content}
                bottleType={root.bottle_type}
                isChainFull={fullChainBottleIds.has(root.id)}
                isMention={Boolean(bottleChains.get(root.id)?.isMention)}
                linkedReplies={linkedReplies.map((reply) => ({
                  id: reply.id,
                  content: reply.content,
                  bottle_type: reply.bottle_type,
                  children: reply.children,
                  isMention: Boolean(reply.isMention),
                }))}
                onOpen={(content, bottleId) => handleOpenBottle(content, bottleId ?? String(root.id))}
              />
            ))}
        {!isLoading &&
          visibleBottles
            .filter((bottle) => renderableBottles.includes(bottle.id))
            .filter((bottle) => !groupedBottleIds.has(bottle.id))
            .map((bottle) => (
              <Bottle
                key={bottle.id}
                id={String(bottle.id)}
                content={bottle.content}
                bottleType={bottle.bottle_type}
                isChainFull={fullChainBottleIds.has(bottle.id)}
                linkedReplies={
                  childrenMap.get(bottle.id)?.length
                    ? childrenMap.get(bottle.id)!.map((c) => ({
                        id: c.id,
                        content: c.content,
                        bottle_type: c.bottle_type,
                        children: [],
                      }))
                    : undefined
                }
                onOpen={(content, bottleId) => handleOpenBottle(content, bottleId ?? String(bottle.id))}
              />
            ))}
      </div>

      {/* Modal Support */}
      {isSupportOpen && (
        <SupportModal
          onClose={() => setIsSupportOpen(false)}
          onSupportConfirmed={() => {}}
        />
      )}

      {/* Modal Pesan Balasan */}
      {selectedMessage && (
        <MessageModal
          content={selectedMessage.content}
          bottleId={selectedMessage.id}
          isChainFull={(selectedMessage.replyCount ?? 0) >= 5}
          onClose={() => setSelectedMessage(null)}
          onReply={() => {}}
          onReport={(bottleId: number, reason: string) => handleReport(bottleId, reason)}
        />
      )}

      {/* Modal Peti Kenangan */}
      {isArchiveOpen && (
        <MemoryArchiveModal
          hasArchiveAccess={false}
          messages={archiveMessages}
          isLoading={isArchiveLoading}
          error={archiveError}
          onClose={() => setIsArchiveOpen(false)}
          onOpenSupport={() => {
            setIsArchiveOpen(false);
            setIsSupportOpen(true);
          }}
        />
      )}
    </div>
  );
}
