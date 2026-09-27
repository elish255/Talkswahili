-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 10/14
-- Run this part after the previous part.


-- Admin-managed withdrawal: no FimiPay call, no provider payout.
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount numeric,
  p_phone text
)
RETURNS public.withdrawal_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := (select auth.uid());
  v_balance numeric;
  v_count integer;
  v_min numeric;
  v_row public.withdrawal_requests;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'You must be logged in'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Enter a valid amount'; END IF;
  IF p_phone IS NULL OR length(trim(p_phone)) < 9 THEN RAISE EXCEPTION 'Enter a valid phone number'; END IF;

  SELECT balance INTO v_balance
  FROM public.profiles
  WHERE id = v_user
  FOR UPDATE;

  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.withdrawal_requests
  WHERE user_id = v_user;

  v_min := CASE WHEN v_count = 0 THEN 50000 ELSE 100000 END;

  IF v_balance < v_min THEN
    RAISE EXCEPTION 'Insufficient balance. Minimum available balance for this withdrawal is TZS %', v_min;
  END IF;
  IF p_amount <= v_min THEN
    RAISE EXCEPTION 'Withdrawal amount must be greater than TZS %', v_min;
  END IF;
  IF p_amount > v_balance THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.profiles
  SET balance = balance - p_amount
  WHERE id = v_user;

  INSERT INTO public.withdrawal_requests (user_id, amount, phone, payout_amount)
  VALUES (v_user, p_amount, trim(p_phone), p_amount)
  RETURNING * INTO v_row;

  INSERT INTO public.balance_transactions(user_id, amount, kind, description, reference_id)
  VALUES (v_user, -p_amount, 'withdrawal', 'Withdrawal request — awaiting admin approval', v_row.id);

  INSERT INTO public.notifications(user_id, title, message)
  VALUES (v_user, 'Withdrawal imepokelewa', 'Ombi lako la TZS ' || to_char(p_amount, 'FM999,999,999,990.00') || ' limepokelewa na litasubiri idhini ya admin.');

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text) TO authenticated;
