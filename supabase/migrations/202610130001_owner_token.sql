ALTER TABLE public.bottles
  ADD COLUMN IF NOT EXISTS owner_token text;

CREATE INDEX IF NOT EXISTS bottles_owner_token_created_at_idx
  ON public.bottles (owner_token, created_at DESC);