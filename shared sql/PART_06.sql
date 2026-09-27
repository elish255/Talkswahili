-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 06/14
-- Run this part after the previous part.


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
