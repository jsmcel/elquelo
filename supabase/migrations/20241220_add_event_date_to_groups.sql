-- Add event_date column to groups table
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS event_date DATE;

