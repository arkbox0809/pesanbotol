-- Migrasi: Tambah kolom `laut` untuk penyelenggaraan cabang laut (fitur Explore)
--
-- Cabang laut yang tersedia:
--   - Laut-Senja
--   - Lautan-Harapan (default untuk botol lama)
--   - Telaga-Senyap

-- 1. Tambah kolom laut (boleh NULL sementara karena halaman /write belum disesuaikan)
ALTER TABLE public.bottles
  ADD COLUMN IF NOT EXISTS laut text;

-- 2. Set semua botol yang sudah ada ke 'Lautan-Harapan'
UPDATE public.bottles
  SET laut = 'Lautan-Harapan'
  WHERE laut IS NULL;

-- 3. Tambah check constraint untuk 3 cabang laut yang diizinkan (NULL tetap diizinkan)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.bottles'::regclass
      AND conname = 'bottles_laut_allowed_check'
  ) THEN
    ALTER TABLE public.bottles
      ADD CONSTRAINT bottles_laut_allowed_check
      CHECK (laut IS NULL OR laut IN ('Laut-Senja', 'Lautan-Harapan', 'Telaga-Senyap'));
  END IF;
END $$;

-- 4. Index untuk mempercepat query berdasarkan laut dan created_at
CREATE INDEX IF NOT EXISTS bottles_laut_created_at_idx
  ON public.bottles (laut, created_at DESC);
