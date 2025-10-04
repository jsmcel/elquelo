-- Ensure anon/authenticated can reference supporting tables in RLS policies
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.event_members TO anon, authenticated;
GRANT SELECT ON public.group_members TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;

