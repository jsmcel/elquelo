-- Add event_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON public.orders(event_id);

