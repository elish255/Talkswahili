-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 14/14
-- Run this part after the previous part.


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

