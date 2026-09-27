-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 09/14
-- Run this part after the previous part.


CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = p_notification_id AND user_id = (select auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;


-- ===== 0006_fimipay.sql =====
-- FimiPay is used ONLY for activation/deposit payments.
-- Withdrawals are NOT connected to FimiPay; they are reviewed and paid by admin.

ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS provider_checkout_url text,
  ADD COLUMN IF NOT EXISTS provider_payload jsonb,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.payment_requests
  DROP CONSTRAINT IF EXISTS payment_requests_amount_check;
ALTER TABLE public.payment_requests
  ADD CONSTRAINT payment_requests_amount_check CHECK (amount = 16000);

CREATE INDEX IF NOT EXISTS payment_requests_provider_reference_idx
  ON public.payment_requests(provider_reference);

-- Keep withdrawal compatibility fields only for the existing TALKSWAHILI UI.
-- They are NOT used for any FimiPay payout.
ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS provider_status text;
