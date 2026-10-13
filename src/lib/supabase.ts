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
}

export interface BottleRow extends Omit<NewBottle, 'owner_token'> {
  id: number
  created_at: string
  is_opened: boolean
  is_hidden: boolean
  report_count: number
  owner_token?: string | null
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
