-- TALKSWAHILI + VELASITE SHARED DATABASE
-- Generated from the working Velasite migrations (0000-0009).
-- Run this ONCE in the Supabase SQL Editor for the shared project.
-- Do not run the individual migration files after this unless you know what you are doing.


-- ===== 0000_create_profiles.sql =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'Tanzania',
  balance numeric NOT NULL DEFAULT 0,
  activated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== 0001_activation_payments.sql =====
-- Activation payment workflow for 1Vela.

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text NOT NULL,
  amount integer NOT NULL DEFAULT 12000 CHECK (amount = 12000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_requests_one_pending_per_user
  ON public.payment_requests (user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS payment_requests_status_created_at_idx
  ON public.payment_requests (status, created_at DESC);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = (select auth.uid())
  );
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

DROP POLICY IF EXISTS "Users can view their own admin membership" ON public.admin_users;
CREATE POLICY "Users can view their own admin membership"
ON public.admin_users FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view their own payment requests"
ON public.payment_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_admin());

DROP POLICY IF EXISTS "Users can submit their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can submit their own payment requests"
ON public.payment_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can see all profiles and change activation status.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING ((select auth.uid()) = id OR private.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (private.is_admin())
WITH CHECK (private.is_admin());

REVOKE INSERT, DELETE ON public.profiles FROM authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.review_activation_payment(
  p_request_id uuid,
  p_status text
)
RETURNS public.payment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.payment_requests;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid review status';
  END IF;

  UPDATE public.payment_requests
  SET
    status = p_status,
    approved_at = CASE WHEN p_status = 'approved' THEN now() ELSE NULL END,
    approved_by = CASE WHEN p_status = 'approved' THEN (select auth.uid()) ELSE NULL END
  WHERE id = p_request_id
    AND status = 'pending'
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Payment request not found or already reviewed';
  END IF;

  IF p_status = 'approved' THEN
    UPDATE public.profiles
    SET activated = true
    WHERE id = result.user_id;
  END IF;

  RETURN result;
END;
$$;

GRANT SELECT, INSERT ON public.payment_requests TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
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
  processed_by uuid REFERENCES auth.users(id)
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
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'You must be logged in';
  END IF;

  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'Invalid chat session';
  END IF;

  -- Server-side reward values must match the published foreigner cards.
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

  IF v_expected IS NULL OR p_amount <> v_expected THEN
    RAISE EXCEPTION 'Invalid chat reward';
  END IF;

  INSERT INTO public.chat_reward_transactions (user_id, session_id, foreigner_id, amount)
  VALUES (v_user, p_session_id, p_foreigner_id, v_expected)
  ON CONFLICT (user_id, session_id) DO NOTHING;

  IF NOT FOUND THEN
    SELECT amount INTO v_existing
    FROM public.chat_reward_transactions
    WHERE user_id = v_user AND session_id = p_session_id;
    RETURN COALESCE(v_existing, 0);
  END IF;

  UPDATE public.profiles
  SET balance = balance + v_expected
  WHERE id = v_user;

  RETURN v_expected;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_chat_reward(uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_chat_reward(uuid, text, numeric) TO authenticated;


-- ===== 0005_admin_notifications.sql =====
-- 1Vela admin controls, notifications, balance ledger and account bans.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL OR private.is_admin());

DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

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

CREATE OR REPLACE FUNCTION public.admin_set_user_ban(
  p_user_id uuid,
  p_banned boolean,
  p_reason text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles
  SET banned = p_banned,
      ban_reason = CASE WHEN p_banned THEN NULLIF(trim(COALESCE(p_reason, '')), '') ELSE NULL END,
      activated = CASE WHEN p_banned THEN false ELSE activated END
  WHERE id = p_user_id
  RETURNING * INTO v_profile;
  IF v_profile.id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  INSERT INTO public.notifications(user_id, title, message)
  VALUES (
    p_user_id,
    CASE WHEN p_banned THEN 'Account imezuiwa' ELSE 'Account imefunguliwa' END,
    CASE WHEN p_banned THEN COALESCE(NULLIF(trim(p_reason), ''), 'Akaunti yako imezuiwa na admin.') ELSE 'Akaunti yako imefunguliwa tena.' END
  );

  RETURN v_profile;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_user_ban(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_activation(
  p_user_id uuid,
  p_activated boolean
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles
  SET activated = p_activated
  WHERE id = p_user_id
  RETURNING * INTO v_profile;
  IF v_profile.id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  INSERT INTO public.notifications(user_id, title, message)
  VALUES (
    p_user_id,
    CASE WHEN p_activated THEN 'Account activated' ELSE 'Account deactivated' END,
    CASE WHEN p_activated THEN 'Account yako imewashwa na unaweza kutumia huduma za 1Vela.' ELSE 'Account yako imezimwa kwa muda.' END
  );
  RETURN v_profile;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_user_activation(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_send_notification(
  p_user_id uuid,
  p_title text,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF length(trim(COALESCE(p_title, ''))) < 1 OR length(trim(COALESCE(p_message, ''))) < 1 THEN
    RAISE EXCEPTION 'Title and message are required';
  END IF;
  INSERT INTO public.notifications(user_id, title, message)
  VALUES (p_user_id, trim(p_title), trim(p_message))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_send_notification(uuid, text, text) TO authenticated;

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
-- FimiPay automatic/push payment metadata and payout metadata.

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
  ADD CONSTRAINT payment_requests_amount_check CHECK (amount = 12000);

CREATE INDEX IF NOT EXISTS payment_requests_provider_reference_idx
  ON public.payment_requests(provider_reference);

ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS fee numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS provider_payload jsonb;

ALTER TABLE public.withdrawal_requests
  DROP CONSTRAINT IF EXISTS withdrawal_requests_status_check;
ALTER TABLE public.withdrawal_requests
  ADD CONSTRAINT withdrawal_requests_status_check CHECK (status IN ('pending','processing','paid','rejected'));

CREATE INDEX IF NOT EXISTS withdrawal_requests_provider_reference_idx
  ON public.withdrawal_requests(provider_reference);

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
  v_fee numeric;
  v_payout numeric;
  v_row public.withdrawal_requests;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'You must be logged in'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Enter a valid amount'; END IF;
  IF p_phone IS NULL OR length(trim(p_phone)) < 9 THEN RAISE EXCEPTION 'Enter a valid phone number'; END IF;

  SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT count(*)::integer INTO v_count FROM public.withdrawal_requests WHERE user_id = v_user;
  v_min := CASE WHEN v_count = 0 THEN 50000 ELSE 100000 END;
  IF v_balance < v_min THEN RAISE EXCEPTION 'Insufficient balance. Minimum available balance for this withdrawal is TZS %', v_min; END IF;
  IF p_amount <= v_min THEN RAISE EXCEPTION 'Withdrawal amount must be greater than TZS %', v_min; END IF;
  IF p_amount > v_balance THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_fee := round(p_amount * 0.05, 2);
  v_payout := p_amount - v_fee;

  UPDATE public.profiles SET balance = balance - p_amount WHERE id = v_user;

  INSERT INTO public.withdrawal_requests (user_id, amount, phone, fee, payout_amount, provider)
  VALUES (v_user, p_amount, trim(p_phone), v_fee, v_payout, 'fimipay')
  RETURNING * INTO v_row;

  INSERT INTO public.balance_transactions(user_id, amount, kind, description, reference_id)
  VALUES (v_user, -p_amount, 'withdrawal', 'Withdrawal request', v_row.id);
  INSERT INTO public.balance_transactions(user_id, amount, kind, description, reference_id)
  VALUES (v_user, -v_fee, 'withdrawal_fee', 'Withdrawal processing fee (included in requested amount)', v_row.id);

  INSERT INTO public.notifications(user_id, title, message)
  VALUES (v_user, 'Withdrawal imeanzishwa', 'Ombi lako la TZS ' || to_char(p_amount, 'FM999,999,999,990.00') || ' limepokelewa. Utapokea TZS ' || to_char(v_payout, 'FM999,999,999,990.00') || '.');

  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_activation_payment(
  p_request_id uuid,
  p_status text
)
RETURNS public.payment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.payment_requests;
BEGIN
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid review status'; END IF;

  UPDATE public.payment_requests
  SET status = p_status,
      approved_at = CASE WHEN p_status = 'approved' THEN now() ELSE NULL END,
      approved_by = CASE WHEN p_status = 'approved' THEN (select auth.uid()) ELSE NULL END
  WHERE id = p_request_id AND status = 'pending'
  RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Payment request not found or already reviewed'; END IF;

  IF p_status = 'approved' THEN
    UPDATE public.profiles SET activated = true WHERE id = result.user_id;
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (result.user_id, 'Deposit approved', 'Malipo yako ya activation yamekubaliwa. Account yako imewashwa.');
  ELSE
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (result.user_id, 'Deposit rejected', 'Malipo yako ya activation yamekataliwa. Tafadhali wasiliana na support.');
  END IF;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.review_activation_payment(uuid, text) TO authenticated;

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
  WHERE id = p_request_id AND status IN ('pending','processing')
  RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Withdrawal request not found or already reviewed'; END IF;

  IF p_status = 'rejected' THEN
    UPDATE public.profiles SET balance = balance + v_row.amount WHERE id = v_row.user_id;
    INSERT INTO public.balance_transactions(user_id, amount, kind, description, reference_id)
    VALUES (v_row.user_id, v_row.amount, 'refund', 'Withdrawal rejected — balance returned', v_row.id);
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (v_row.user_id, 'Withdrawal rejected', 'Withdrawal yako imekataliwa na TZS ' || to_char(v_row.amount, 'FM999,999,999,990.00') || ' imerudishwa kwenye balance.');
  ELSE
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (v_row.user_id, 'Transfer Initiated', 'Payout ya TZS ' || to_char(COALESCE(v_row.payout_amount, v_row.amount), 'FM999,999,999,990.00') || ' imetumwa kwenye namba yako.');
  END IF;

  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.review_withdrawal(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.system_refund_withdrawal(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.withdrawal_requests;
BEGIN
  SELECT * INTO v_row FROM public.withdrawal_requests WHERE id = p_request_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_row.status <> 'rejected' THEN RETURN; END IF;

  IF EXISTS (
    SELECT 1 FROM public.balance_transactions
    WHERE reference_id = v_row.id AND kind = 'refund'
  ) THEN RETURN; END IF;

  UPDATE public.profiles SET balance = balance + v_row.amount WHERE id = v_row.user_id;
  INSERT INTO public.balance_transactions(user_id, amount, kind, description, reference_id)
  VALUES (v_row.user_id, v_row.amount, 'refund', 'FimiPay payout failed — balance returned', v_row.id);
  INSERT INTO public.notifications(user_id, title, message)
  VALUES (v_row.user_id, 'Withdrawal failed', 'FimiPay haikukamilisha payout. Balance yako imerudishwa.');
END;
$$;
REVOKE ALL ON FUNCTION public.system_refund_withdrawal(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.system_refund_withdrawal(uuid) TO service_role;
ALTER TABLE public.payment_requests ALTER COLUMN amount SET DEFAULT 12000;


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

-- Do not double-count the processing fee in the ledger: the requested amount is already the full balance debit.
DELETE FROM public.balance_transactions
WHERE kind = 'withdrawal_fee';


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

ALTER TABLE public.automatic_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auto_payments_select_own_or_admin" ON public.automatic_payments;
CREATE POLICY "auto_payments_select_own_or_admin"
ON public.automatic_payments FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
));

GRANT SELECT, INSERT, UPDATE ON public.automatic_payments TO authenticated;
GRANT ALL ON public.automatic_payments TO service_role;

-- Keep both profile activation fields correct when the server activates an account.
CREATE OR REPLACE FUNCTION public.activate_user_from_auto_payment(
  target_user_id uuid,
  auto_payment_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_rows integer := 0;
BEGIN
  UPDATE public.automatic_payments
  SET status = 'paid', updated_at = now()
  WHERE id = auto_payment_id
    AND user_id = target_user_id
    AND status IN ('pending','processing');

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET activated = true,
      is_active = true
  WHERE id = target_user_id
    AND COALESCE(banned, false) = false
    AND COALESCE(is_banned, false) = false;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_user_from_auto_payment(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_user_from_auto_payment(uuid, uuid) TO service_role;

