-- TALKSWAHILI final business rules migration
-- Run after the existing Velasite/TALKSWAHILI shared SQL.
-- Activation: TZS 16,000. Activation bonus: TZS 10,000 once.
-- Withdrawal is paid manually by ADMIN; FimiPay is NOT used for withdrawal.

ALTER TABLE public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_amount_check;
ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_amount_check CHECK (amount = 16000);
ALTER TABLE public.payment_requests ALTER COLUMN amount SET DEFAULT 16000;

CREATE OR REPLACE FUNCTION public.grant_activation_bonus(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.balance_transactions
    WHERE user_id = p_user_id
      AND kind = 'admin_credit'
      AND description = 'Activation bonus'
  ) INTO v_exists;

  IF v_exists THEN RETURN 0; END IF;

  UPDATE public.profiles
  SET balance = balance + 10000
  WHERE id = p_user_id;

  INSERT INTO public.balance_transactions(user_id, amount, kind, description)
  VALUES (p_user_id, 10000, 'admin_credit', 'Activation bonus');

  INSERT INTO public.notifications(user_id, title, message)
  VALUES (p_user_id, 'Bonus ya activation', 'Umepewa bonus ya TZS 10,000 kwa sababu account yako imekuwa Active.');

  RETURN 10000;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_activation_bonus(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_activation_bonus(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.activate_automatic_payment(
  p_request_id uuid, p_provider_reference text, p_provider_status text, p_provider_payload jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_user uuid; v_was_active boolean;
BEGIN
  SELECT user_id, activated INTO v_user, v_was_active FROM public.payment_requests pr JOIN public.profiles p ON p.id=pr.user_id
  WHERE pr.id=p_request_id AND pr.provider='automatic' FOR UPDATE;
  IF v_user IS NULL THEN RETURN false; END IF;
  UPDATE public.payment_requests SET status='approved', provider_reference=p_provider_reference, provider_status=p_provider_status, provider_payload=p_provider_payload, paid_at=now() WHERE id=p_request_id;
  UPDATE public.profiles SET activated=true WHERE id=v_user AND banned=false;
  IF NOT COALESCE(v_was_active,false) THEN PERFORM public.grant_activation_bonus(v_user); END IF;
  INSERT INTO public.notifications(user_id,title,message) VALUES(v_user,'Account activated','Malipo yamehakikishwa na account yako imewashwa.');
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.activate_automatic_payment(uuid,text,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.review_activation_payment(p_request_id uuid, p_status text)
RETURNS public.payment_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE result public.payment_requests; v_was_active boolean;
BEGIN
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid review status'; END IF;
  UPDATE public.payment_requests SET status=p_status, approved_at=CASE WHEN p_status='approved' THEN now() ELSE NULL END, approved_by=CASE WHEN p_status='approved' THEN (select auth.uid()) ELSE NULL END WHERE id=p_request_id AND status='pending' RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Payment request not found or already reviewed'; END IF;
  IF p_status='approved' THEN
    SELECT activated INTO v_was_active FROM public.profiles WHERE id=result.user_id FOR UPDATE;
    UPDATE public.profiles SET activated=true WHERE id=result.user_id;
    IF NOT COALESCE(v_was_active,false) THEN PERFORM public.grant_activation_bonus(result.user_id); END IF;
    INSERT INTO public.notifications(user_id,title,message) VALUES(result.user_id,'Deposit approved','Malipo yako ya activation yamekubaliwa. Account yako imewashwa.');
  ELSE
    INSERT INTO public.notifications(user_id,title,message) VALUES(result.user_id,'Deposit rejected','Malipo yako ya activation yamekataliwa. Tafadhali tuma tena.');
  END IF;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.review_activation_payment(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_activation(p_user_id uuid, p_activated boolean)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_profile public.profiles; v_was_active boolean;
BEGIN
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT activated INTO v_was_active FROM public.profiles WHERE id=p_user_id FOR UPDATE;
  UPDATE public.profiles SET activated=p_activated WHERE id=p_user_id RETURNING * INTO v_profile;
  IF v_profile.id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF p_activated AND NOT COALESCE(v_was_active,false) THEN PERFORM public.grant_activation_bonus(p_user_id); END IF;
  INSERT INTO public.notifications(user_id,title,message) VALUES(p_user_id,CASE WHEN p_activated THEN 'Account activated' ELSE 'Account deactivated' END,CASE WHEN p_activated THEN 'Account yako imewashwa na bonus yako ya activation imeongezwa.' ELSE 'Account yako imezimwa kwa muda.' END);
  RETURN v_profile;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_user_activation(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount numeric, p_phone text)
RETURNS public.withdrawal_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_user uuid := (select auth.uid()); v_balance numeric; v_row public.withdrawal_requests; v_min numeric := 50000;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'You must be logged in'; END IF;
  IF p_amount IS NULL OR p_amount < v_min THEN RAISE EXCEPTION 'Minimum withdrawal is TZS 50,000'; END IF;
  IF p_phone IS NULL OR length(trim(p_phone)) < 9 THEN RAISE EXCEPTION 'Enter a valid phone number'; END IF;
  SELECT balance INTO v_balance FROM public.profiles WHERE id=v_user FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF p_amount > v_balance THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.profiles SET balance=balance-p_amount WHERE id=v_user;
  INSERT INTO public.withdrawal_requests(user_id,amount,phone,fee,payout_amount,provider) VALUES(v_user,p_amount,trim(p_phone),0,p_amount,'admin') RETURNING * INTO v_row;
  INSERT INTO public.balance_transactions(user_id,amount,kind,description,reference_id) VALUES(v_user,-p_amount,'withdrawal','Withdrawal request',v_row.id);
  INSERT INTO public.notifications(user_id,title,message) VALUES(v_user,'Withdrawal imepokelewa','Ombi lako la TZS '||to_char(p_amount,'FM999,999,999,990.00')||' limepokelewa. Admin atakufanyia malipo.');
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_withdrawal(p_request_id uuid,p_status text)
RETURNS public.withdrawal_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_row public.withdrawal_requests;
BEGIN
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('paid','rejected') THEN RAISE EXCEPTION 'Invalid review status'; END IF;
  UPDATE public.withdrawal_requests SET status=p_status,processed_at=now(),processed_by=(select auth.uid()),provider='admin',fee=0,payout_amount=amount WHERE id=p_request_id AND status IN ('pending','processing') RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Withdrawal request not found or already reviewed'; END IF;
  IF p_status='rejected' THEN
    UPDATE public.profiles SET balance=balance+v_row.amount WHERE id=v_row.user_id;
    INSERT INTO public.balance_transactions(user_id,amount,kind,description,reference_id) VALUES(v_row.user_id,v_row.amount,'refund','Withdrawal rejected — balance returned',v_row.id);
    INSERT INTO public.notifications(user_id,title,message) VALUES(v_row.user_id,'Withdrawal rejected','Withdrawal yako imekataliwa na TZS '||to_char(v_row.amount,'FM999,999,999,990.00')||' imerudishwa kwenye balance.');
  ELSE
    INSERT INTO public.notifications(user_id,title,message) VALUES(v_row.user_id,'Withdrawal approved','Admin amethibitisha malipo ya TZS '||to_char(v_row.amount,'FM999,999,999,990.00')||'.');
  END IF;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.review_withdrawal(uuid,text) TO authenticated;
