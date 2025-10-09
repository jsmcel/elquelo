-- Helper functions for RLS to avoid cross-table recursion
-- and permit membership checks under SECURITY DEFINER

SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_event_member(eid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  res boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.event_members em
    WHERE em.event_id = eid AND em.user_id = auth.uid()
  ) INTO res;
  RETURN COALESCE(res, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_event_editor(eid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  res boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.event_members em
    WHERE em.event_id = eid AND em.user_id = auth.uid()
      AND em.role IN ('owner','editor')
  ) INTO res;
  RETURN COALESCE(res, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(gid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  res boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = gid AND gm.user_id = auth.uid()
  ) INTO res;
  RETURN COALESCE(res, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(gid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  res boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = gid AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ) INTO res;
  RETURN COALESCE(res, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_event_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_editor(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid) TO anon, authenticated;

-- Rewire qrs policies to use helper functions
DROP POLICY IF EXISTS "Users and event members can view QRs" ON public.qrs;
CREATE POLICY "Users and event members can view QRs" ON public.qrs
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_event_member(qrs.event_id)
    OR public.is_group_member(qrs.group_id)
  );

DROP POLICY IF EXISTS "Users and editors can update QRs" ON public.qrs;
CREATE POLICY "Users and editors can update QRs" ON public.qrs
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.is_group_admin(qrs.group_id)
    OR public.is_event_editor(qrs.event_id)
  );

