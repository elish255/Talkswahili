-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 11/14
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
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('paid','rejected') THEN RAISE EXCEPTION 'Invalid review status'; END IF;

  UPDATE public.withdrawal_requests
  SET status = p_status,
      processed_at = now(),
      processed_by = (select auth.uid())
  WHERE id = p_request_id AND status = 'pending'
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Withdrawal request not found or already reviewed'; END IF;

  IF p_status = 'rejected' THEN
    UPDATE public.profiles SET balance = balance + v_row.amount WHERE id = v_row.user_id;
    INSERT INTO public.balance_transactions(user_id, amount, kind, description, reference_id)
    VALUES (v_row.user_id, v_row.amount, 'refund', 'Withdrawal rejected by admin — balance returned', v_row.id);
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (v_row.user_id, 'Withdrawal rejected', 'Withdrawal yako imekataliwa na admin na TZS ' || to_char(v_row.amount, 'FM999,999,999,990.00') || ' imerudishwa kwenye balance.');
  ELSE
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (v_row.user_id, 'Withdrawal approved', 'Admin ameidhinisha withdrawal yako ya TZS ' || to_char(v_row.amount, 'FM999,999,999,990.00') || '.');
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_withdrawal(uuid, text) TO authenticated;

-- ===== 0007_ledger_and_safety.sql =====
-- Keep chat rewards visible in the balance ledger and keep user-facing copy consistent.

CREATE OR REPLACE FUNCTION public.credit_chat_reward(
  p_session_id uuid,
  p_foreigner_id text,
  p_amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := (select auth.uid());
  v_expected numeric;
  v_existing numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'You must be logged in'; END IF;
  IF p_session_id IS NULL THEN RAISE EXCEPTION 'Invalid chat session'; END IF;

  v_expected := CASE p_foreigner_id
    WHEN 'isabella' THEN 54000
    WHEN 'mateo' THEN 37000
    WHEN 'amelia' THEN 74000
    WHEN 'kenji' THEN 48000
    WHEN 'sophie' THEN 43000
    WHEN 'lucas' THEN 62000
    WHEN 'emma' THEN 31000
    WHEN 'daniel' THEN 56000
    ELSE NULL
  END;
  IF v_expected IS NULL OR p_amount <> v_expected THEN RAISE EXCEPTION 'Invalid chat reward'; END IF;

  INSERT INTO public.chat_reward_transactions (user_id, session_id, foreigner_id, amount)
  VALUES (v_user, p_session_id, p_foreigner_id, v_expected)
  ON CONFLICT (user_id, session_id) DO NOTHING;

  IF NOT FOUND THEN
    SELECT amount INTO v_existing FROM public.chat_reward_transactions WHERE user_id = v_user AND session_id = p_session_id;
    RETURN COALESCE(v_existing, 0);
  END IF;

  UPDATE public.profiles SET balance = balance + v_expected WHERE id = v_user;
  INSERT INTO public.balance_transactions(user_id, amount, kind, description, reference_id)
  VALUES (v_user, v_expected, 'chat_reward', 'Chat session reward', p_session_id);
  INSERT INTO public.notifications(user_id, title, message)
  VALUES (v_user, 'Chat reward imeongezwa', 'Umepewa TZS ' || to_char(v_expected, 'FM999,999,999,990.00') || ' kwa kukamilisha chat session.');
  RETURN v_expected;
END;
$$;
GRANT EXECUTE ON FUNCTION public.credit_chat_reward(uuid, text, numeric) TO authenticated;
