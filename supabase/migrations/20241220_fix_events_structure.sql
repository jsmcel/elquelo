-- Fix events and qrs table structure for proper despedida flow

-- 1. Add group_id to events table (evento pertenece a un grupo)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- 2. Add event_id to qrs table (QRs se asocian a un evento después del pago)
ALTER TABLE public.qrs 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- 3. Add order_id to events table (para saber qué orden creó el evento)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_group_id ON public.events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_order_id ON public.events(order_id);
CREATE INDEX IF NOT EXISTS idx_qrs_event_id ON public.qrs(event_id);

-- 5. Add event_type column to events if needed
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_type') THEN
    ALTER TABLE public.events ADD COLUMN event_type TEXT DEFAULT 'despedida';
  END IF;
END $$;


