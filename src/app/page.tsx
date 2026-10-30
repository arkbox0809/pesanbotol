'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RiverBackground from '@/components/RiverBackground';
import Bottle from '@/components/bottle';
import MessageModal from '@/components/MessageModal';
import SupportModal from '@/components/SupportModal';
import MemoryArchiveModal from '../components/MemoryArchiveModal';
import LegalMenu from '@/components/LegalMenu';
import { supabase, reportBottle } from '@/lib/supabase';
import type { BottleRow } from '@/lib/supabase';
import { BookOpen, Compass, Heart, PenLine } from 'lucide-react';
import { getDeviceToken, hasArchiveAccess as readArchiveAccess } from '@/lib/auth';
import { getUnreadNotifications } from '@/lib/notifications';
import type { SupportConfirmation } from '@/lib/auth';
import NotificationBell from '@/components/NotificationBell';

const MAX_VISIBLE_BOTTLES = 75;
const PAGE_SIZE = 1000;
// Hanya ambil 1000 botol pada development agar `npm run dev` lebih responsif.
// Production tetap 5000 (tidak berubah).
const MAX_FEED_BOTTLES = process.env.NODE_ENV === 'development' ? 1000 : 5000;
const FEED_TIMEOUT_MS = 12000;
const MAX_CHAIN_REPLIES = 5;
const MAX_CHAIN_DEPTH = 5;

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

export default function Home() {
  const [bottles, setBottles] = useState<BottleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [highlightBottleId, setHighlightBottleId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasArchiveEntitlement, setHasArchiveEntitlement] = useState(false);
  const [archiveMessages, setArchiveMessages] = useState<BottleRow[]>([]);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<{
    content: string;
    id: string;
    replyCount: number;
  } | null>(null);
  const router = useRouter();

  // Ambil botol nyata dari Supabase saat halaman dimuat
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
    setDeviceToken(getDeviceToken());
    setHasArchiveEntitlement(readArchiveAccess());
    setIsLoading(true);
    setFetchError(null);

    async function loadBottles() {
      if (!supabase) {
        // Env belum dikonfigurasi → beri tahu pengguna dengan cara yang lembut
        if (!isCancelled) {
          setIsLoading(false);
          setFetchError(
            'Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di file .env.local, lalu restart dev server.'
          );
        }
        return;
      }

      try {
        const allBottles: BottleRow[] = [];
        for (let offset = 0; offset < MAX_FEED_BOTTLES; offset += PAGE_SIZE) {
          const pageEnd = Math.min(offset + PAGE_SIZE, MAX_FEED_BOTTLES) - 1;
          const { data, error } = await supabase
            .from('bottles')
            .select('id, content, bottle_type, created_at, is_hidden, expires_at')
            .eq('is_hidden', false)
            .or('expires_at.is.null,expires_at.gt.now()')
            .order('created_at', { ascending: false })
            .range(offset, pageEnd)
            .abortSignal(controller.signal);

          if (error) throw error;

          const page = (data as BottleRow[]) ?? [];
          allBottles.push(...page);
          if (page.length < pageEnd - offset + 1) break;
        }

        if (!isCancelled) {
          setBottles(allBottles);
        }
      } catch (err) {
        if (!isCancelled) {
          setFetchError(getFeedErrorMessage(err, controller.signal.aborted));
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadBottles();

    return () => {
      isCancelled = true; // cegah setState setelah komponen unmount
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [loadAttempt]);

  // Muat notifikasi balasan belum dibaca untuk device token ini
  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = getDeviceToken();
      if (!token) return;
      const list = await getUnreadNotifications(token);
      if (mounted) {
        setNotifications(list);
        setNotificationCount(list.length);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Handle replyToId dari query param (dari klik notifikasi push)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const replyToId = params.get('replyToId');
    if (replyToId) {
      const id = parseInt(replyToId, 10);
      if (!isNaN(id)) {
        setHighlightBottleId(id);
        // Scroll dan highlight akan ditangani oleh komponen Bottle
      }
    }
  }, []);

  const visibleBottles = useMemo(
    () => bottles.filter((bottle) => !bottle.is_hidden),
    [bottles]
  );
  const displayedBottles = useMemo(() => visibleBottles, [visibleBottles]);
  const hasBottles = visibleBottles.length > 0;
  const bottleMap = useMemo(
    () => new Map(bottles.map((bottle) => [bottle.id, bottle])),
    [bottles]
  );

  // Analisis hubungan pesan balasan dan hitung kedalaman rantai (maksimal MAX_CHAIN_DEPTH)
  const chainAnalysis = useMemo(() => {
    const chains = new Map<number, {
      rootId: number;
      depth: number;
      parentId: number | null;
      isMention: boolean;
      mentionTargetId: number | null;
    }>();
    const mentionTargets = new Map<number, number>();

    // Helper untuk mencari root dan depth secara rekursif
    const getChainStats = (id: number): {
      rootId: number;
      depth: number;
      parentId: number | null;
      isMention: boolean;
      mentionTargetId: number | null;
    } => {
      if (chains.has(id)) return chains.get(id)!;

      const bottle = bottleMap.get(id);
      if (!bottle) return { rootId: id, depth: 1, parentId: null, isMention: false, mentionTargetId: null };

      const match = bottle.content.match(/^Balasan untuk\s+(\d+):/i);
      if (match) {
        const parentId = parseInt(match[1], 10);
        if (bottleMap.has(parentId)) {
          const parentStats = getChainStats(parentId);
          // Jika induk sudah mencapai kedalaman maksimal, botol ini menjadi mention bukan rantai
          if (parentStats.depth >= MAX_CHAIN_DEPTH) {
            const stats = {
              rootId: parentStats.rootId,
              depth: 1,
              parentId: null,
              isMention: true,
              mentionTargetId: parentId,
            };
            chains.set(id, stats);
            mentionTargets.set(id, parentId);
            return stats;
          }
          const stats = {
            rootId: parentStats.rootId,
            depth: parentStats.depth + 1,
            parentId: parentId,
            isMention: parentStats.isMention,
            mentionTargetId: null,
          };
          chains.set(id, stats);
          return stats;
        }
      }

      const stats = { rootId: id, depth: 1, parentId: null, isMention: false, mentionTargetId: null };
      chains.set(id, stats);
      return stats;
    };

    bottles.forEach((b) => getChainStats(b.id));
    return { chains, mentionTargets };
  }, [bottles, bottleMap]);

  const bottleChains = chainAnalysis.chains;
  const mentionTargets = chainAnalysis.mentionTargets;

  // ID induk dari botol yang sedang di-highlight (jika highlightBottleId adalah balasan),
  // digunakan untuk menampilkan visual highlight pada item balasan dalam rantai.
  const highlightParentId = useMemo(() => {
    if (highlightBottleId === null) return null;
    const stats = bottleChains.get(highlightBottleId);
    return stats?.parentId ?? null;
  }, [highlightBottleId, bottleChains]);

  // Peta anak per botol (balasan langsung ke botol tersebut), dibatasi MAX_CHAIN_REPLIES per induk
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

  // Semua ID botol yang merupakan anak dari botol lain (jangan render terpisah)
  const childIds = useMemo(() => {
    const ids = new Set<number>();
    childrenMap.forEach((children) => {
      children.forEach((c) => ids.add(c.id));
    });
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

  // ID botol yang rantai balasannya sudah mencapai batas MAX_CHAIN_REPLIES (5),
  // digunakan hanya untuk menampilkan label visual "Penuh" pada label botol/gulungan.
  const fullChainBottleIds = useMemo(() => {
    const ids = new Set<number>();
    replyCounts.forEach((count, parentId) => {
      if (count >= MAX_CHAIN_REPLIES) ids.add(parentId);
    });
    return ids;
  }, [replyCounts]);

  const replyGroups = useMemo(() => {
    const displayedIds = new Set(visibleBottles.map((bottle) => bottle.id));
    const repliesByParent = new Map<number, BottleRow[]>();

    bottles.forEach((bottle) => {
      const parentId = bottleChains.get(bottle.id)?.parentId;
      if (!parentId) return;
      const replies = repliesByParent.get(parentId) ?? [];
      replies.push(bottle);
      repliesByParent.set(parentId, replies);
    });

    // Include mention bottles in displayedIds to ensure they are not filtered out
    bottles.forEach((bottle) => {
      const stats = bottleChains.get(bottle.id);
      if (stats?.isMention) {
        displayedIds.add(bottle.id);
      }
    });

    return bottles
      .filter((bottle) => !bottle.is_hidden && bottleChains.get(bottle.id)?.parentId === null)
      .flatMap((root) => {
        const replies = (repliesByParent.get(root.id) ?? [])
          .filter((reply) => !reply.is_hidden)
          .sort((a, b) => a.created_at.localeCompare(b.created_at));
        if (!displayedIds.has(root.id) && !replies.some((reply) => displayedIds.has(reply.id))) {
          return [];
        }
        const result = [{ root, replies, linkedReplies: replies.slice(0, MAX_CHAIN_REPLIES).map((reply) => ({
          id: reply.id,
          content: reply.content,
          bottle_type: reply.bottle_type,
          children: childrenMap.get(reply.id) ?? [],
          isMention: Boolean(bottleChains.get(reply.id)?.isMention),
        })) }];
        
        // Include mention bottles (bottles with isMention=true)
        const rootStats = bottleChains.get(root.id);
        if (rootStats?.isMention && rootStats.mentionTargetId) {
          result.push({
            root: root,
            replies: [],
            linkedReplies: [{
              id: root.id,
              content: root.content,
              bottle_type: root.bottle_type,
              children: [],
              isMention: Boolean(rootStats?.isMention),
            }]
          });
        }
        
        return result;
      });
  }, [bottles, bottleChains, visibleBottles]);

  const groupedBottleIds = useMemo(() => {
    const ids = new Set<number>();
    replyGroups.forEach(({ root, linkedReplies }) => {
      ids.add(root.id);
      linkedReplies.forEach((reply) => {
        ids.add(reply.id);
        reply.children.forEach((c) => ids.add(c.id));
      });
    });
    return ids;
  }, [replyGroups]);

  // Cari botol mana saja yang sudah dijadikan pasangan di dalam chain
  // agar botol induk tidak dirender dua kali secara terpisah
  const chainedParentIds = useMemo(() => {
    const parentIds = new Set<number>();
    displayedBottles.forEach((bottle) => {
      const stats = bottleChains.get(bottle.id);
      if (stats && stats.parentId && bottleMap.has(stats.parentId)) {
        parentIds.add(stats.parentId);
      }
    });
    return parentIds;
  }, [displayedBottles, bottleChains, bottleMap]);

  // Batasi total botol yang dirender di sungai menjadi MAX_VISIBLE_BOTTLES.
  // Penghapusan dilakukan SETELAH seluruh logika chain (bottleChains, replyGroups,
  // groupedBottleIds, chainedParentIds) selesai, sehingga pesan yang terikat
  // dalam rantai balasan tidak terbuang sebelum relasi induk-balasan diproses.
  const renderableBottles = useMemo(() => {
    const rendered = new Set<number>();

    replyGroups.forEach(({ root, linkedReplies }) => {
      rendered.add(root.id);
      linkedReplies.forEach((reply) => rendered.add(reply.id));
    });

    displayedBottles.forEach((bottle) => {
      const stats = bottleChains.get(bottle.id);
      if (!stats?.parentId && !rendered.has(bottle.id)) {
        rendered.add(bottle.id);
      }
    });

    // Urutkan berdasarkan created_at DESC (terbaru dulu) lalu potong ke MAX_VISIBLE_BOTTLES
    return [...rendered]
      .map((id) => bottleMap.get(id)!)
      .filter((b): b is BottleRow => Boolean(b))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, MAX_VISIBLE_BOTTLES)
      .map((b) => b.id);
  }, [replyGroups, displayedBottles, bottleChains, bottleMap]);

  const handleReport = async (bottleId: number, reason: string) => {
    const result = await reportBottle(bottleId, reason);
    if (result.isHidden) {
      // Sembunyikan langsung dari daftar botol yang sedang berlayar di sungai
      setBottles((prev) => prev.filter((b) => b.id !== bottleId));
    }
  };

  const handleOpenBottle = (content: string, bottleId: string) => {
    const id = parseInt(bottleId, 10);
    setSelectedMessage({
      content,
      id: bottleId,
      replyCount: replyCounts.get(id) ?? 0,
    });
  };

  const handleOpenArchive = async () => {
    setIsArchiveOpen(true);
    setArchiveError(null);
    if (!hasArchiveEntitlement) return;

    const ownerToken = deviceToken ?? getDeviceToken();
    if (!ownerToken) {
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
        .eq('owner_token', ownerToken)
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

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      {/* 1. Latar Belakang Aliran Sungai */}
      <RiverBackground />

      {/* 2. Judul / Header Minimalist di Pojok */}
      <div className="absolute top-6 left-6 z-10">
        <h1 className="text-2xl font-serif font-bold text-white tracking-wider drop-shadow-md">
          PesanBotol
        </h1>
        <p className="max-w-[calc(100vw-10rem)] text-xs leading-relaxed text-sky-200/70 font-mono tracking-wide sm:max-w-none">
          Tempat membuang rahasia dan harapan ke arus waktu.
        </p>
      </div>

      {/* 3. Tombol Navigasi ke Halaman Tulis Pesan */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        {/* 3a. Tombol Notifikasi Balasan */}
        <NotificationBell
          onReplyClick={(bottleId: number) => {
            setIsNotificationPanelOpen(false);
            setHighlightBottleId(bottleId);
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
          aria-label="Jelajahi Laut Lain"
          title="Jelajahi Laut Lain"
          className="flex items-center justify-center gap-2 rounded-full border border-slate-200/50 bg-slate-100/90 p-2.5 text-sm font-medium text-slate-900 shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-200 lg:px-4 lg:py-2.5"
        >
          <Compass size={18} aria-hidden="true" />
          <span className="hidden lg:inline">Explore</span>
        </Link>
        <LegalMenu />
      </div>

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

      {/* 3b. Status counter pesan hanyut di pojok kanan bawah */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1 rounded-full border border-slate-200/80 bg-[#fdfbf7]/90 p-2 px-3 text-xs font-mono text-slate-700 shadow-lg backdrop-blur-sm">
        {visibleBottles.length}/{MAX_VISIBLE_BOTTLES} pesan hanyut
      </div>

      {/* 4. Indikator loading saat data ditarik dari database */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white/90">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
            <p className="font-mono text-xs tracking-wide">
              Mencari botol di arus…
            </p>
          </div>
        </div>
      )}

      {/* 5. Pesan error jika pengambilan data gagal */}
      {!isLoading && fetchError && (
        <div className="absolute inset-x-0 top-16 z-20 flex justify-center px-4">
          <p
            role="alert"
            className="max-w-md rounded-md border border-red-200/40 bg-red-900/50 px-4 py-2 text-center text-xs text-red-100 backdrop-blur-sm"
          >
            ⚠️ {fetchError}
            <button
              type="button"
              onClick={() => setLoadAttempt((attempt) => attempt + 1)}
              className="ml-2 underline decoration-dotted underline-offset-2 hover:text-white"
            >
              Coba lagi
            </button>
          </p>
        </div>
      )}

      {/* 6. Keadaan kosong: arus belum memiliki botol */}
      {!isLoading && !fetchError && !hasBottles && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <p className="max-w-sm text-center font-serif text-lg italic leading-relaxed text-sky-100/80">
            Arus masih kosong. Jadilah yang pertama menghanyutkan pesan.
          </p>
        </div>
      )}

      {/* 7. Area Jalur Aliran Botol (Sungai Utama) */}
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
                isHighlighted={root.id === highlightBottleId}
                highlightedReplyId={highlightParentId === root.id ? highlightBottleId : null}
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
          displayedBottles
            .filter((bottle) => renderableBottles.includes(bottle.id))
            .filter((bottle) => !groupedBottleIds.has(bottle.id))
            .filter((bottle) => !chainedParentIds.has(bottle.id))
            .filter((bottle) => !childIds.has(bottle.id))
            .map((bottle) => {
              const stats = bottleChains.get(bottle.id);
              const rootGroup = replyGroups.find(({ root }) => root.id === stats?.parentId);
              const isOverflowReply = rootGroup?.replies.some((reply) => reply.id === bottle.id)
                && !rootGroup.linkedReplies.some((reply) => reply.id === bottle.id);
              const isDepthMention = Boolean(stats?.isMention);
              const parentId = isOverflowReply ? null : stats?.parentId ?? null;
              const parentBottle = parentId ? bottleMap.get(parentId) ?? null : null;
              const bottleChildren = childrenMap.get(bottle.id) ?? [];
              const mentionTargetId = isDepthMention
                ? stats?.mentionTargetId ?? null
                : (isOverflowReply ? stats?.parentId ?? null : null);

              return (
                <Bottle
                  key={bottle.id}
                  id={String(bottle.id)}
                  content={bottle.content}
                  bottleType={bottle.bottle_type}
                  isHighlighted={bottle.id === highlightBottleId}
                  isChainFull={fullChainBottleIds.has(bottle.id)}
                  replyToId={parentId}
                  parentBottle={
                    parentBottle && parentId !== null
                      ? {
                          id: parentBottle.id,
                          content: parentBottle.content,
                          bottle_type: parentBottle.bottle_type,
                          isMention: Boolean(bottleChains.get(parentId)?.isMention),
                        }
                      : null
                  }
                  linkedReplies={bottleChildren.length > 0
                    ? bottleChildren.map((c) => ({
                        id: c.id,
                        content: c.content,
                        bottle_type: c.bottle_type,
                        children: childrenMap.get(c.id) ?? [],
                      }))
                    : undefined}
                  isMention={isOverflowReply || isDepthMention}
                  mentionTargetId={mentionTargetId}
                  onOpen={(content: string, bottleId?: string) => {
                    const bId = bottleId ? parseInt(bottleId, 10) : bottle.id;
                    handleOpenBottle(content, String(bId));
                  }}
                />
              );
            })}
      </div>

      {/* 8. Modal Popup saat Botol Dibuka */}
      <MessageModal
        content={selectedMessage?.content ?? null}
        bottleId={selectedMessage?.id ?? null}
        isChainFull={(selectedMessage?.replyCount ?? 0) >= MAX_CHAIN_REPLIES}
        onClose={() => setSelectedMessage(null)}
        onReply={() => {
          if (selectedMessage) {
            router.push(
              `/write?replyTo=${encodeURIComponent(selectedMessage.content)}&replyToId=${encodeURIComponent(selectedMessage.id)}`
            );
          }
          setSelectedMessage(null);
        }}
        onReport={handleReport}
      />
      {isArchiveOpen && (
        <MemoryArchiveModal
          hasArchiveAccess={hasArchiveEntitlement}
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
      {isSupportOpen && (
        <SupportModal
          onClose={() => setIsSupportOpen(false)}
          onSupportConfirmed={(confirmation: SupportConfirmation) => {
            if (confirmation.product === 'archive') setHasArchiveEntitlement(true);
          }}
        />
      )}
    </main>
  );
}

