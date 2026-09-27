-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 03/14
-- Run this part after the previous part.

GRANT EXECUTE ON FUNCTION public.review_activation_payment(uuid, text) TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;
GRANT ALL ON public.admin_users TO service_role;


-- ===== 0002_public_payment_activity.sql =====
-- Public, read-only activity feed for approved activation payments.
-- It exposes only first name, profile location, amount and approval time.
-- It does not expose phone numbers, emails, user IDs, or other account data.

CREATE OR REPLACE FUNCTION public.get_public_payment_activity()
RETURNS TABLE (
  first_name text,
  location text,
  amount integer,
  approved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    split_part(trim(p.full_name), ' ', 1) AS first_name,
    COALESCE(NULLIF(trim(p.country), ''), 'Tanzania') AS location,
    pr.amount,
    pr.approved_at
  FROM public.payment_requests AS pr
  JOIN public.profiles AS p ON p.id = pr.user_id
  WHERE pr.status = 'approved'
    AND pr.approved_at IS NOT NULL
    AND trim(p.full_name) <> ''
  ORDER BY pr.approved_at DESC
  LIMIT 30;
$$;

REVOKE ALL ON FUNCTION public.get_public_payment_activity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_payment_activity() TO anon, authenticated;


-- ===== 0003_withdrawals.sql =====
-- Withdrawal requests with server-side balance/rule enforcement.
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  payout_amount numeric(12,2),
  provider_reference text,
  provider_status text
);

CREATE INDEX IF NOT EXISTS withdrawal_requests_user_created_idx
  ON public.withdrawal_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS withdrawal_requests_status_created_idx
  ON public.withdrawal_requests (status, created_at DESC);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawals"
ON public.withdrawal_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_admin());

DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins can update withdrawals"
ON public.withdrawal_requests FOR UPDATE TO authenticated
USING (private.is_admin())
WITH CHECK (private.is_admin());

GRANT SELECT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
