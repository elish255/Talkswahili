-- TALKSWAHILI + VELASITE SHARED DATABASE -- PART 08/14
-- Run this part after the previous part.


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
