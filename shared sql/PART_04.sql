-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 04/14
-- Run this part after the previous part.


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
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'You must be logged in';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Enter a valid amount';
  END IF;

  IF p_phone IS NULL OR length(trim(p_phone)) < 9 THEN
    RAISE EXCEPTION 'Enter a valid phone number';
  END IF;

  SELECT balance INTO v_balance
  FROM public.profiles
  WHERE id = v_user
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

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

  INSERT INTO public.withdrawal_requests (user_id, amount, phone)
  VALUES (v_user, p_amount, trim(p_phone))
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text) TO authenticated;
