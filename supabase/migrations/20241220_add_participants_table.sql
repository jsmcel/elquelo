-- Create participants table for configurator
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  size TEXT DEFAULT 'M',
  is_novio_novia BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_participants_group_id ON public.participants(group_id);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for participants
DROP POLICY IF EXISTS "Group members can view participants" ON public.participants;
CREATE POLICY "Group members can view participants" ON public.participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = participants.group_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group admins can manage participants" ON public.participants;
CREATE POLICY "Group admins can manage participants" ON public.participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = participants.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_participants_updated_at ON public.participants;
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



