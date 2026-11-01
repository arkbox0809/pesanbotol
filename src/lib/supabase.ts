import { createClient } from '@supabase/supabase-js'

// ============================================================================
// PesanBotol — Integrasi Supabase
// ============================================================================

// --- Konfigurasi klien -------------------------------------------------------
// URL harus berupa base URL proyek (https://<ref>.supabase.co).
// supabase-js menambahkan `/rest/v1` sendiri; jika URL sudah mengandung
// `/rest/v1` (atau trailing slash), request menjadi `/rest/v1//rest/v1/...`
// dan PostgREST membalas error PGRST125 "Invalid path specified in request URL".
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isConfigured) {
  console.warn(
    '[PesanBotol] Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di file .env.local, lalu restart dev server.'
  )
}

// null sengaja dipakai agar aplikasi tetap berjalan di mode development
// sebelum variabel lingkungan diisi, tanpa melempar error saat import.
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// --- Skema tabel `bottles` ---------------------------------------------------
export type BottleType = 'glass' | 'scroll' | 'anchor' | 'crystal' | 'jade' | 'lantern'

export interface NewBottle {
  content: string
  bottle_type: BottleType
  owner_token: string
  laut?: string | null
  expires_at?: string | null
}

export interface BottleRow extends Omit<NewBottle, 'owner_token'> {
  id: number
  created_at: string
  is_opened: boolean
  is_hidden: boolean
  report_count: number
  owner_token?: string | null
  laut?: string | null
  expires_at?: string | null
}

export const REGULAR_BOTTLE_TYPES: BottleType[] = ['glass', 'scroll']

export function isRegularBottle(bottle_type: BottleType): boolean {
  return REGULAR_BOTTLE_TYPES.includes(bottle_type)
}

export function getDefaultExpiresAt(bottle_type: BottleType): string | null {
  if (!isRegularBottle(bottle_type)) return null
  const now = new Date()
  now.setDate(now.getDate() + 3)
  return now.toISOString()
}

export interface OceanBranch {
  laut: string
  bottle_count: number
}

// --- Aksi simpan -------------------------------------------------------------
/**
 * Menyimpan botol baru ke tabel `bottles`.
 *
 * Kolom yang diisi fungsi ini:
 *  - content      → isi pesan (di-trim)
 *  - bottle_type  → 'glass' | 'scroll' | 'anchor' | 'crystal' | 'jade' | 'lantern'
 *  - owner_token  → token unik perangkat pemilik
 *  - is_opened    → false
 *  - is_hidden    → false
 *  - report_count → 0
 *
 * Kolom `created_at` diisi otomatis oleh database (default `now()`)
 * dan `id` di-generate otomatis (identity/bigserial).
 *
 * @returns Baris `bottles` yang baru saja tersimpan.
 * @throws  Error dengan pesan yang aman ditampilkan ke pengguna.
 */
export async function createBottle(input: NewBottle): Promise<BottleRow> {
  if (!supabase) {
    throw new Error(
      'Koneksi Supabase belum dikonfigurasi. Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah diisi di file .env.local.'
    )
  }

  const { data, error } = await supabase
    .from('bottles')
    .insert({
      content: input.content.trim(),
      bottle_type: input.bottle_type,
      owner_token: input.owner_token,
      laut: input.laut ?? null,
      expires_at: input.expires_at ?? getDefaultExpiresAt(input.bottle_type),
      is_opened: false,
      is_hidden: false,
      report_count: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('[PesanBotol] Gagal menyimpan botol:', error)
    throw new Error(`Gagal menyimpan pesan: ${error.message}`)
  }

  return data as BottleRow
}

/**
 * Melaporkan pesan botol yang tidak pantas.
 * Menambah `report_count`. Jika `report_count` mencapai batas tertentu (misal >= 3),
 * botol otomatis ditandai `is_hidden: true` agar tidak muncul lagi di sungai.
 */
export async function reportBottle(
  bottleId: number,
  reason?: string
): Promise<{ success: boolean; isHidden: boolean }> {
  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.')
  }

  // 1. Ambil data botol saat ini
  const { data: currentBottle, error: fetchError } = await supabase
    .from('bottles')
    .select('id, report_count')
    .eq('id', bottleId)
    .single()

  if (fetchError || !currentBottle) {
    console.error('[PesanBotol] Gagal mengambil botol untuk dilaporkan:', fetchError)
    throw new Error('Botol tidak ditemukan atau gagal dilaporkan.')
  }

  const newReportCount = (currentBottle.report_count ?? 0) + 1
  const shouldHide = newReportCount >= 3

  // 2. Update report_count dan is_hidden
  const { error: updateError } = await supabase
    .from('bottles')
    .update({
      report_count: newReportCount,
      is_hidden: shouldHide,
    })
    .eq('id', bottleId)

  if (updateError) {
    console.error('[PesanBotol] Gagal memperbarui laporan botol:', updateError)
    throw new Error(`Gagal mengirim laporan: ${updateError.message}`)
  }

  if (reason) {
    console.info(`[PesanBotol] Laporan botol #${bottleId} alasan: ${reason}`)
  }

  return { success: true, isHidden: shouldHide }
}

/**
 * Mengambil daftar cabang laut yang tersedia beserta jumlah botol per laut.
 * Hanya mengembalikan laut yang memiliki minimal 1 botol (tidak tersembunyi).
 */
const PREDEFINED_OCEANS: string[] = ['Laut-Senja', 'Lautan-Harapan', 'Telaga-Senyap']

export async function getAvailableOceans(): Promise<OceanBranch[]> {
  if (!supabase) {
    return PREDEFINED_OCEANS.map((laut) => ({ laut, bottle_count: 0 }))
  }

  const { data, error } = await supabase
    .from('bottles')
    .select('laut')
    .eq('is_hidden', false)
    .not('laut', 'is', null)
    // Hanya hitung botol yang belum expired (spesial = NULL, biasa = belum melewati 3 hari)
    .or('expires_at.is.null,expires_at.gt.now()')

  if (error || !data) {
    console.error('[PesanBotol] Gagal mengambil daftar laut:', error)
    return PREDEFINED_OCEANS.map((laut) => ({ laut, bottle_count: 0 }))
  }

  const counts = new Map<string, number>()
  data.forEach((row) => {
    const laut = row.laut ?? 'Lautan-Harapan'
    counts.set(laut, (counts.get(laut) ?? 0) + 1)
  })

  return PREDEFINED_OCEANS.map((laut) => ({
    laut,
    bottle_count: counts.get(laut) ?? 0,
  }))
}

/**
 * Mengambil botol dari cabang laut tertentu, difilter is_hidden = false
 * dan excludes botol biasa yang sudah expired (lebih dari 3 hari).
 * Parameter `ocean` boleh null/undefined untuk mengambil semua botol tanpa laut.
 */
export async function getBottlesByOcean(ocean: string | null | undefined): Promise<BottleRow[]> {
  if (!supabase) {
    return []
  }

  let query = supabase
    .from('bottles')
    .select('*')
    .eq('is_hidden', false)
    // Botol spesial (expires_at NULL) tidak kedaluwarsa; botol biasa sudah expired dihilangkan
    .or('expires_at.is.null,expires_at.gt.now()')

  if (ocean) {
    query = query.eq('laut', ocean)
  } else {
    query = query.is('laut', null)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('[PesanBotol] Gagal mengambil botol per laut:', error)
    return []
  }

  return (data as BottleRow[]) ?? []
}

/**
 * Label tampilan ramah untuk setiap cabang laut.
 */
export const OCEAN_LABELS: Record<string, string> = {
  'Laut-Senja': 'Laut Senja',
  'Lautan-Harapan': 'Lautan Harapan',
  'Telaga-Senyap': 'Telaga Senyap',
}

/**
 * Mengembalikan label tampilan untuk sebuah laut, atau fallback jika tidak dikenal.
 */
export function getOceanLabel(laut: string | null | undefined): string {
  if (!laut) return 'Belum Tercantum'
  return OCEAN_LABELS[laut] ?? laut
}
