-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 05/14
-- Run this part after the previous part.


CREATE OR REPLACE FUNCTION public.review_withdrawal(
  p_request_id uuid,
  p_status text
)
RETURNS public.withdrawal_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.withdrawal_requests;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('paid','rejected') THEN
    RAISE EXCEPTION 'Invalid review status';
  END IF;

  UPDATE public.withdrawal_requests
  SET status = p_status,
      processed_at = now(),
      processed_by = (select auth.uid())
  WHERE id = p_request_id AND status = 'pending'
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found or already reviewed';
  END IF;

  IF p_status = 'rejected' THEN
    UPDATE public.profiles
    SET balance = balance + v_row.amount
    WHERE id = v_row.user_id;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_withdrawal(uuid, text) TO authenticated;


-- ===== 0004_chat_rewards.sql =====
-- Secure chat rewards: credits the user's real profile balance once per chat session.
CREATE TABLE IF NOT EXISTS public.chat_reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  foreigner_id text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS chat_reward_transactions_user_created_idx
  ON public.chat_reward_transactions (user_id, created_at DESC);

ALTER TABLE public.chat_reward_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat rewards" ON public.chat_reward_transactions;
CREATE POLICY "Users can view own chat rewards"
ON public.chat_reward_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_admin());

GRANT SELECT ON public.chat_reward_transactions TO authenticated;
GRANT ALL ON public.chat_reward_transactions TO service_role;
