-- Crear tabla qr_designs
CREATE TABLE IF NOT EXISTS public.qr_designs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  qr_code TEXT REFERENCES public.qrs(code) ON DELETE CASCADE,
  design_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_qr_designs_qr_code ON public.qr_designs(qr_code);

