-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 12/14
-- Run this part after the previous part.




-- ===== 0008_working_push_payment.sql =====
-- Harden the automatic push flow using the working payment_requests table.
-- Manual/Lipa Namba requests remain provider='manual' and keep the existing admin approval flow.

ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS provider_checkout_url text,
  ADD COLUMN IF NOT EXISTS provider_payload jsonb,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS payment_requests_provider_reference_idx
  ON public.payment_requests(provider_reference);
CREATE INDEX IF NOT EXISTS payment_requests_user_provider_created_idx
  ON public.payment_requests(user_id, provider, created_at DESC);

-- Automatic payments are activated only after a confirmed SUCCESS status.
CREATE OR REPLACE FUNCTION public.activate_automatic_payment(
  p_request_id uuid,
  p_provider_reference text,
  p_provider_status text,
  p_provider_payload jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid;
BEGIN
  SELECT user_id INTO v_user
  FROM public.payment_requests
  WHERE id = p_request_id
    AND provider = 'automatic'
  FOR UPDATE;

  IF v_user IS NULL THEN RETURN false; END IF;

  UPDATE public.payment_requests
  SET status = 'approved',
      provider_reference = p_provider_reference,
      provider_status = p_provider_status,
      provider_payload = p_provider_payload,
      paid_at = now()
  WHERE id = p_request_id;

  UPDATE public.profiles
  SET activated = true
  WHERE id = v_user AND banned = false;

  INSERT INTO public.notifications(user_id, title, message)
  VALUES (v_user, 'Account activated', 'Malipo yamehakikishwa na account yako imewashwa.');

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_automatic_payment(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_automatic_payment(uuid, text, text, jsonb) TO service_role;


-- ===== 0009_magic_schema_compatibility.sql =====
-- Compatibility layer for databases created from the working automatic-payment project.
-- Keeps the existing 1Vela application schema working while also supporting
-- the working project's is_active / is_banned profile fields.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Bring the two schema variants into sync before creating the triggers.
UPDATE public.profiles
SET activated = COALESCE(is_active, activated),
    is_active = COALESCE(activated, is_active),
    banned = COALESCE(is_banned, banned),
    is_banned = COALESCE(banned, is_banned);
