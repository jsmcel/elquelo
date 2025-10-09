-- QR despedida core schema upgrade

-- Ensure uuid generation function is available
-- Prefer pgcrypto's gen_random_uuid() over uuid-ossp
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Extend events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'evento_despedida';

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'design';

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS qr_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS content_ttl_days INTEGER DEFAULT 30;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_timezone TEXT;

-- Ensure constraint checks for new status/type columns
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_type_check CHECK (type IN ('evento_despedida', 'evento', 'custom'));

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_status_check CHECK (status IN ('design', 'pending_payment', 'live', 'archived'));

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_content_ttl_positive;
ALTER TABLE public.events
  ADD CONSTRAINT events_content_ttl_positive CHECK (content_ttl_days IS NULL OR content_ttl_days > 0);

-- Extend orders table to store event metadata
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS event_type TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS qr_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS qr_codes JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS event_date_request TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS content_ttl_days INTEGER;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS qr_code TEXT;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_content_ttl_positive;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_content_ttl_positive CHECK (content_ttl_days IS NULL OR content_ttl_days > 0);

-- Extend qrs table to connect with events and destinations
ALTER TABLE public.qrs
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

ALTER TABLE public.qrs
  ADD COLUMN IF NOT EXISTS active_destination_id UUID;

ALTER TABLE public.qrs
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.qrs
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Extend scans table for richer analytics
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS destination_id UUID;

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS resolved_url TEXT;

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS device_type TEXT;

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS geo JSONB;

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS status_code INTEGER;

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS event_phase TEXT;

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS expired BOOLEAN DEFAULT false;

-- Create event_members table
CREATE TABLE IF NOT EXISTS public.event_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_email TEXT,
  invite_token TEXT,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_id, user_id),
  UNIQUE (invite_token)
);

-- Destinations per QR
CREATE TABLE IF NOT EXISTS public.qr_destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  qr_id UUID REFERENCES public.qrs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT,
  slug TEXT,
  target_url TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  switch_rule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT qr_destinations_type_check CHECK (type IN (
    'external', 'album', 'microsite', 'prueba', 'timeline', 'message_wall', 'playlist', 'map', 'surprise'
  ))
);

-- Event modules toggle table
CREATE TABLE IF NOT EXISTS public.event_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  settings JSONB DEFAULT '{}'::jsonb,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_id, type)
);

-- Albums and media
CREATE TABLE IF NOT EXISTS public.event_albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_album_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.event_albums(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  asset_url TEXT NOT NULL,
  thumbnail_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'gif', 'audio')),
  caption TEXT,
  visibility TEXT DEFAULT 'approved' CHECK (visibility IN ('approved', 'pending', 'hidden')),
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Microsite pages
CREATE TABLE IF NOT EXISTS public.event_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  schema JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  theme TEXT,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_id, slug)
);

-- Pruebas (challenges)
CREATE TABLE IF NOT EXISTS public.event_pruebas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions JSONB DEFAULT '{}'::jsonb,
  reward JSONB DEFAULT '{}'::jsonb,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  auto_lock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_prueba_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prueba_id UUID NOT NULL REFERENCES public.event_pruebas(id) ON DELETE CASCADE,
  qr_id UUID REFERENCES public.qrs(id) ON DELETE SET NULL,
  participant_name TEXT,
  submission JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages from friends
CREATE TABLE IF NOT EXISTS public.event_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.event_modules(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_email TEXT,
  media_url TEXT,
  transcript TEXT,
  visibility TEXT DEFAULT 'draft' CHECK (visibility IN ('draft', 'scheduled', 'published', 'archived')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event action log
CREATE TABLE IF NOT EXISTS public.event_actions_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Destination daily metrics storage
CREATE TABLE IF NOT EXISTS public.qr_destination_metrics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id UUID NOT NULL REFERENCES public.qr_destinations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  scan_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  top_referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (destination_id, date)
);

-- Foreign keys that require new tables
ALTER TABLE public.qrs
  ADD CONSTRAINT qrs_active_destination_fk
  FOREIGN KEY (active_destination_id) REFERENCES public.qr_destinations(id) ON DELETE SET NULL;

ALTER TABLE public.scans
  ADD CONSTRAINT scans_destination_fk
  FOREIGN KEY (destination_id) REFERENCES public.qr_destinations(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_qr_group_id ON public.events(qr_group_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_events_stripe_session ON public.events(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_orders_qr_group_id ON public.orders(qr_group_id);
CREATE INDEX IF NOT EXISTS idx_orders_event_type ON public.orders(event_type);

CREATE INDEX IF NOT EXISTS idx_qrs_event_id ON public.qrs(event_id);
CREATE INDEX IF NOT EXISTS idx_qrs_active_destination ON public.qrs(active_destination_id);

CREATE INDEX IF NOT EXISTS idx_scans_destination_id ON public.scans(destination_id);
CREATE INDEX IF NOT EXISTS idx_scans_event_id ON public.scans(event_id);
CREATE INDEX IF NOT EXISTS idx_scans_expired ON public.scans(expired);

CREATE INDEX IF NOT EXISTS idx_event_members_event_id ON public.event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_members_user_id ON public.event_members(user_id);

CREATE INDEX IF NOT EXISTS idx_qr_destinations_event_id ON public.qr_destinations(event_id);
CREATE INDEX IF NOT EXISTS idx_qr_destinations_qr_id ON public.qr_destinations(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_destinations_schedule ON public.qr_destinations(start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_event_modules_event_id ON public.event_modules(event_id);
CREATE INDEX IF NOT EXISTS idx_event_modules_type ON public.event_modules(type);

CREATE INDEX IF NOT EXISTS idx_event_albums_event_id ON public.event_albums(event_id);
CREATE INDEX IF NOT EXISTS idx_event_album_media_album_id ON public.event_album_media(album_id);
CREATE INDEX IF NOT EXISTS idx_event_album_media_uploader_id ON public.event_album_media(uploader_id);

CREATE INDEX IF NOT EXISTS idx_event_pages_event_id ON public.event_pages(event_id);

CREATE INDEX IF NOT EXISTS idx_event_pruebas_event_id ON public.event_pruebas(event_id);
CREATE INDEX IF NOT EXISTS idx_event_prueba_attempts_prueba_id ON public.event_prueba_attempts(prueba_id);
CREATE INDEX IF NOT EXISTS idx_event_prueba_attempts_qr_id ON public.event_prueba_attempts(qr_id);

CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON public.event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_schedule ON public.event_messages(scheduled_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_event_actions_log_event_id ON public.event_actions_log(event_id);

CREATE INDEX IF NOT EXISTS idx_qr_destination_metrics_daily_destination ON public.qr_destination_metrics_daily(destination_id);

-- Enable Row Level Security for new tables
ALTER TABLE public.event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_album_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_pruebas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_prueba_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_destination_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Ensure base privileges so policies can reference tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.event_members TO anon, authenticated;
GRANT SELECT ON public.group_members TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;

-- Update existing policies for qrs and scans to include event membership
DROP POLICY IF EXISTS "Users can view own QRs" ON public.qrs;
CREATE POLICY "Users and event members can view QRs" ON public.qrs
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.event_members em
      WHERE em.event_id = qrs.event_id
        AND em.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1
      FROM public.group_members gm
      WHERE gm.group_id = qrs.group_id
        AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own QRs" ON public.qrs;
CREATE POLICY "Users can create own QRs" ON public.qrs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own QRs" ON public.qrs;
CREATE POLICY "Users and editors can update QRs" ON public.qrs
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.group_members gm
      WHERE gm.group_id = qrs.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1
      FROM public.event_members em
      WHERE em.event_id = qrs.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Scans are viewable by QR owner" ON public.scans;
CREATE POLICY "Scans are viewable by controllers" ON public.scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.qrs 
      WHERE id = scans.qr_id 
        AND (user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.event_members em
            WHERE em.event_id = qrs.event_id
              AND em.user_id = auth.uid()
          )
        )
    )
  );

-- Policies for event_members
DROP POLICY IF EXISTS "Event members can view" ON public.event_members;
CREATE POLICY "Event members can view" ON public.event_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.event_members em
      WHERE em.event_id = event_members.event_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event owners manage members" ON public.event_members;
CREATE POLICY "Event owners manage members" ON public.event_members
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.event_members em
      WHERE em.event_id = event_members.event_id
        AND em.user_id = auth.uid()
        AND em.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.event_members em
      WHERE em.event_id = event_members.event_id
        AND em.user_id = auth.uid()
        AND em.role = 'owner'
    )
  );

-- Policies for QR destinations
DROP POLICY IF EXISTS "Event members read destinations" ON public.qr_destinations;
CREATE POLICY "Event members read destinations" ON public.qr_destinations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = qr_destinations.event_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event editors manage destinations" ON public.qr_destinations;
CREATE POLICY "Event editors manage destinations" ON public.qr_destinations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = qr_destinations.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = qr_destinations.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  );

-- Policies for event modules and pages
DROP POLICY IF EXISTS "Event members read modules" ON public.event_modules;
CREATE POLICY "Event members read modules" ON public.event_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_modules.event_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event editors manage modules" ON public.event_modules;
CREATE POLICY "Event editors manage modules" ON public.event_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_modules.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_modules.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Event members read pages" ON public.event_pages;
CREATE POLICY "Event members read pages" ON public.event_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_pages.event_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event editors manage pages" ON public.event_pages;
CREATE POLICY "Event editors manage pages" ON public.event_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_pages.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_pages.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  );

-- Policies for albums/media
DROP POLICY IF EXISTS "Event members read albums" ON public.event_albums;
CREATE POLICY "Event members read albums" ON public.event_albums
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_albums.event_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event editors manage albums" ON public.event_albums;
CREATE POLICY "Event editors manage albums" ON public.event_albums
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_albums.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_albums.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Event members read album media" ON public.event_album_media;
CREATE POLICY "Event members read album media" ON public.event_album_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_albums ea
      JOIN public.event_members em ON em.event_id = ea.event_id
      WHERE ea.id = event_album_media.album_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event editors manage album media" ON public.event_album_media;
CREATE POLICY "Event editors manage album media" ON public.event_album_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_albums ea
      JOIN public.event_members em ON em.event_id = ea.event_id
      WHERE ea.id = event_album_media.album_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_albums ea
      JOIN public.event_members em ON em.event_id = ea.event_id
      WHERE ea.id = event_album_media.album_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  );

-- Policies for pruebas and attempts
DROP POLICY IF EXISTS "Event members read pruebas" ON public.event_pruebas;
CREATE POLICY "Event members read pruebas" ON public.event_pruebas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_pruebas.event_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event editors manage pruebas" ON public.event_pruebas;
CREATE POLICY "Event editors manage pruebas" ON public.event_pruebas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_pruebas.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_pruebas.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Event members read attempts" ON public.event_prueba_attempts;
CREATE POLICY "Event members read attempts" ON public.event_prueba_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_pruebas ep
      JOIN public.event_members em ON em.event_id = ep.event_id
      WHERE ep.id = event_prueba_attempts.prueba_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event editors manage attempts" ON public.event_prueba_attempts;
CREATE POLICY "Event editors manage attempts" ON public.event_prueba_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_pruebas ep
      JOIN public.event_members em ON em.event_id = ep.event_id
      WHERE ep.id = event_prueba_attempts.prueba_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_pruebas ep
      JOIN public.event_members em ON em.event_id = ep.event_id
      WHERE ep.id = event_prueba_attempts.prueba_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  );

-- Policies for messages
DROP POLICY IF EXISTS "Event members read messages" ON public.event_messages;
CREATE POLICY "Event members read messages" ON public.event_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_messages.event_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event editors manage messages" ON public.event_messages;
CREATE POLICY "Event editors manage messages" ON public.event_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_messages.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_messages.event_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'editor')
    )
  );

-- Policies for action log and metrics
DROP POLICY IF EXISTS "Event members read action log" ON public.event_actions_log;
CREATE POLICY "Event members read action log" ON public.event_actions_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      WHERE em.event_id = event_actions_log.event_id
        AND em.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event members read destination metrics" ON public.qr_destination_metrics_daily;
CREATE POLICY "Event members read destination metrics" ON public.qr_destination_metrics_daily
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_members em
      JOIN public.qr_destinations qrd ON qrd.id = qr_destination_metrics_daily.destination_id
      WHERE em.event_id = qrd.event_id
        AND em.user_id = auth.uid()
    )
  );

-- Register timestamp triggers for new tables
DROP TRIGGER IF EXISTS update_event_members_updated_at ON public.event_members;
CREATE TRIGGER update_event_members_updated_at BEFORE UPDATE ON public.event_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_qr_destinations_updated_at ON public.qr_destinations;
CREATE TRIGGER update_qr_destinations_updated_at BEFORE UPDATE ON public.qr_destinations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_modules_updated_at ON public.event_modules;
CREATE TRIGGER update_event_modules_updated_at BEFORE UPDATE ON public.event_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_albums_updated_at ON public.event_albums;
CREATE TRIGGER update_event_albums_updated_at BEFORE UPDATE ON public.event_albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_album_media_updated_at ON public.event_album_media;
CREATE TRIGGER update_event_album_media_updated_at BEFORE UPDATE ON public.event_album_media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_pages_updated_at ON public.event_pages;
CREATE TRIGGER update_event_pages_updated_at BEFORE UPDATE ON public.event_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_pruebas_updated_at ON public.event_pruebas;
CREATE TRIGGER update_event_pruebas_updated_at BEFORE UPDATE ON public.event_pruebas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_prueba_attempts_updated_at ON public.event_prueba_attempts;
CREATE TRIGGER update_event_prueba_attempts_updated_at BEFORE UPDATE ON public.event_prueba_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_messages_updated_at ON public.event_messages;
CREATE TRIGGER update_event_messages_updated_at BEFORE UPDATE ON public.event_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_qr_destination_metrics_daily_updated_at ON public.qr_destination_metrics_daily;
CREATE TRIGGER update_qr_destination_metrics_daily_updated_at BEFORE UPDATE ON public.qr_destination_metrics_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backfill existing records with defaults where needed
UPDATE public.events
SET type = COALESCE(type, 'evento_despedida'),
    status = COALESCE(status, CASE WHEN is_active THEN 'live' ELSE 'archived' END),
    content_ttl_days = COALESCE(content_ttl_days, 30)
WHERE type IS NULL
   OR status IS NULL
   OR content_ttl_days IS NULL;

UPDATE public.orders
SET event_type = COALESCE(event_type, 'evento_despedida')
WHERE event_type IS NULL;










