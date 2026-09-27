-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 13/14
-- Run this part after the previous part.


CREATE OR REPLACE FUNCTION public.sync_profile_activation_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.activated IS DISTINCT FROM OLD.activated THEN
    NEW.is_active := NEW.activated;
  ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    NEW.activated := NEW.is_active;
  END IF;

  IF NEW.banned IS DISTINCT FROM OLD.banned THEN
    NEW.is_banned := NEW.banned;
  ELSIF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    NEW.banned := NEW.is_banned;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_activation_columns ON public.profiles;
CREATE TRIGGER sync_profile_activation_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_activation_columns();

-- The manual/Lipa Namba flow used by 1Vela expects this table.
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 16000,
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'manual',
  provider_reference text,
  provider_status text,
  provider_checkout_url text,
  provider_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS provider_checkout_url text,
  ADD COLUMN IF NOT EXISTS provider_payload jsonb,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS payment_requests_user_id_idx
  ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS payment_requests_provider_reference_idx
  ON public.payment_requests(provider_reference);
CREATE INDEX IF NOT EXISTS payment_requests_user_provider_created_idx
  ON public.payment_requests(user_id, provider, created_at DESC);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view their own payment requests"
ON public.payment_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can submit their own payment requests"
ON public.payment_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;

-- Ensure automatic payment tracking also exists when only the working project
-- migrations were applied.
CREATE TABLE IF NOT EXISTS public.automatic_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id text UNIQUE,
  amount numeric(12,2) NOT NULL DEFAULT 16000,
  currency text NOT NULL DEFAULT 'TZS',
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  checkout_url text,
  provider_status text,
  provider_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automatic_payments_user_id_idx
  ON public.automatic_payments(user_id);
CREATE INDEX IF NOT EXISTS automatic_payments_status_idx
  ON public.automatic_payments(status);
