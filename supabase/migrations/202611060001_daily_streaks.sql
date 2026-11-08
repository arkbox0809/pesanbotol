-- Migrasi: Tabel daily_streaks dan RPC record_daily_visit
-- Dibutuhkan untuk fitur 7-day visit streak (cosmetic only)

CREATE TABLE IF NOT EXISTS public.daily_streaks (
  device_token TEXT PRIMARY KEY,
  current_streak INT NOT NULL DEFAULT 0 CHECK (current_streak BETWEEN 0 AND 7),
  last_visit_date DATE NOT NULL,
  grace_available BOOLEAN NOT NULL DEFAULT TRUE,
  completed_cycles INT NOT NULL DEFAULT 0,
  last_completed_at DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_streaks_updated_at_idx ON public.daily_streaks(updated_at);

ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_token dapat melihat streak miliknya"
  ON public.daily_streaks
  FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.record_daily_visit(
  p_device_token TEXT,
  p_local_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row record;
  v_server_date DATE;
  v_gap INT;
  v_new_streak INT;
  v_new_grace BOOLEAN;
  v_just_completed BOOLEAN := FALSE;
BEGIN
  -- Validasi
  IF TRIM(p_device_token) = '' THEN
    RETURN jsonb_build_object('state', NULL, 'accepted', FALSE);
  END IF;

  -- Sanity bound: tanggal lokal ≤ 1 hari dari server UTC (gunakan UTC date)
  v_server_date := CURRENT_DATE;
  IF ABS(p_local_date - v_server_date) > 1 THEN
    RETURN jsonb_build_object('state', NULL, 'accepted', FALSE);
  END IF;

  -- Pilih baris dengan FOR UPDATE untuk serialisasi
  BEGIN
    SELECT * INTO v_row FROM public.daily_streaks
    WHERE device_token = p_device_token
    FOR UPDATE;
  EXCEPTION WHEN NO_DATA_FOUND THEN
    v_row := NULL;
  END;

  IF v_row IS NULL THEN
    INSERT INTO public.daily_streaks (device_token, current_streak, last_visit_date, grace_available, completed_cycles, last_completed_at)
    VALUES (p_device_token, 1, p_local_date, TRUE, 0, NULL)
    RETURNING * INTO v_row;
    RETURN jsonb_build_object('state', row_to_json(v_row), 'just_completed', FALSE, 'accepted', TRUE);
  END IF;

  -- Idempotent: kunjungan yang sama pada tanggal yang sama
  IF v_row.last_visit_date = p_local_date THEN
    RETURN jsonb_build_object('state', row_to_json(v_row), 'just_completed', FALSE, 'accepted', TRUE);
  END IF;

  -- Backdate: kunjungan setelah hari terakhir (tidak diizinkan)
  IF v_row.last_visit_date > p_local_date THEN
    RETURN jsonb_build_object('state', row_to_json(v_row), 'just_completed', FALSE, 'accepted', FALSE);
  END IF;

  -- Hitung gap
  v_gap := p_local_date - v_row.last_visit_date;
  v_new_streak := v_row.current_streak;
  v_new_grace := v_row.grace_available;

  IF v_gap = 1 THEN
    v_new_streak := v_row.current_streak + 1;
  ELSIF v_gap = 2 AND v_row.grace_available AND v_row.current_streak BETWEEN 1 AND 6 THEN
    v_new_streak := v_row.current_streak + 1;
    v_new_grace := FALSE;
  ELSE
    v_new_streak := 1;
    v_new_grace := TRUE;
  END IF;

  -- Kunjungan setelah siklus selesai: mulai siklus baru (tidak menambah completed_cycles)
  IF v_row.current_streak >= 7 THEN
    UPDATE public.daily_streaks
    SET current_streak = 1,
        last_visit_date = p_local_date,
        grace_available = TRUE,
        updated_at = now()
    WHERE device_token = p_device_token
    RETURNING * INTO v_row;
    RETURN jsonb_build_object('state', row_to_json(v_row), 'just_completed', FALSE, 'accepted', TRUE);
  END IF;

  -- Jika streak mencapai 7 (atau sudah 7), selesaikan siklus
  IF v_new_streak >= 7 THEN
    UPDATE public.daily_streaks
    SET current_streak = v_new_streak,
        last_visit_date = p_local_date,
        grace_available = v_new_grace,
        completed_cycles = v_row.completed_cycles + 1,
        last_completed_at = p_local_date,
        updated_at = now()
    WHERE device_token = p_device_token
    RETURNING * INTO v_row;
    v_just_completed := TRUE;
  ELSE
    UPDATE public.daily_streaks
    SET current_streak = v_new_streak,
        last_visit_date = p_local_date,
        grace_available = v_new_grace,
        updated_at = now()
    WHERE device_token = p_device_token
    RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object('state', row_to_json(v_row), 'just_completed', v_just_completed, 'accepted', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_daily_visit(TEXT, DATE) TO anon;