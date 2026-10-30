-- Migrasi: Tambah kolom `expires_at` untuk batas waktu habis botol biasa
--
-- Botol biasa (glass, scroll) kedaluwarsa 3 hari setelah dibuat.
-- Botol spesial (anchor, crystal, jade, lantern) tidak kedaluwarsa (expires_at NULL).

-- 1. Tambah kolom expires_at (boleh NULL untuk botol spesial)
ALTER TABLE public.bottles
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2. Set expires_at untuk botol biasa yang sudah ada (created_at + 3 hari)
UPDATE public.bottles
  SET expires_at = created_at + interval '3 days'
  WHERE expires_at IS NULL
    AND bottle_type IN ('glass', 'scroll');

-- 3. Index untuk mempercepat query filter expired
CREATE INDEX IF NOT EXISTS bottles_expires_at_idx
  ON public.bottles (expires_at);

-- 4. Index komposit untuk query per laut + expired
CREATE INDEX IF NOT EXISTS bottles_laut_expires_at_idx
  ON public.bottles (laut, expires_at);
