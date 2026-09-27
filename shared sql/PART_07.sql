-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 07/14
-- Run this part after the previous part.


GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  kind text NOT NULL CHECK (kind IN ('chat_reward','admin_credit','admin_debit','withdrawal','withdrawal_fee','deposit','refund')),
  description text NOT NULL DEFAULT '',
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS balance_transactions_user_created_idx
  ON public.balance_transactions (user_id, created_at DESC);

ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own balance transactions" ON public.balance_transactions;
CREATE POLICY "Users can view own balance transactions"
ON public.balance_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_admin());
GRANT SELECT ON public.balance_transactions TO authenticated;
GRANT ALL ON public.balance_transactions TO service_role;

CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_user_id uuid,
  p_amount numeric,
  p_reason text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_balance numeric;
  v_kind text;
BEGIN
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN RAISE EXCEPTION 'Amount cannot be zero'; END IF;
  IF length(trim(COALESCE(p_reason, ''))) < 2 THEN RAISE EXCEPTION 'Reason is required'; END IF;

  SELECT balance INTO v_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_balance + p_amount < 0 THEN RAISE EXCEPTION 'Balance cannot go below zero'; END IF;

  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_balance;

  v_kind := CASE WHEN p_amount > 0 THEN 'admin_credit' ELSE 'admin_debit' END;
  INSERT INTO public.balance_transactions(user_id, amount, kind, description)
  VALUES (p_user_id, p_amount, v_kind, trim(p_reason));

  INSERT INTO public.notifications(user_id, title, message)
  VALUES (
    p_user_id,
    CASE WHEN p_amount > 0 THEN 'Balance imeongezwa' ELSE 'Balance imepunguzwa' END,
    trim(p_reason) || ' — TZS ' || to_char(abs(p_amount), 'FM999,999,999,990.00')
  );

  RETURN v_balance;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, numeric, text) TO authenticated;
