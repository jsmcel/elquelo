-- Script completo para arreglar la tabla qr_designs
-- Ejecutar paso a paso en Supabase SQL Editor

-- PASO 1: Verificar duplicados
SELECT qr_code, COUNT(*) as count
FROM public.qr_designs 
GROUP BY qr_code 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- PASO 2: Eliminar duplicados (manteniendo el más reciente)
DELETE FROM public.qr_designs 
WHERE id NOT IN (
  SELECT DISTINCT ON (qr_code) id
  FROM public.qr_designs
  ORDER BY qr_code, created_at DESC
);

-- PASO 3: Agregar restricción UNIQUE a qr_code
ALTER TABLE public.qr_designs 
ADD CONSTRAINT qr_designs_qr_code_unique UNIQUE (qr_code);

-- PASO 4: Agregar columnas faltantes
ALTER TABLE public.qr_designs 
ADD COLUMN IF NOT EXISTS product_size TEXT,
ADD COLUMN IF NOT EXISTS product_color TEXT,
ADD COLUMN IF NOT EXISTS product_gender TEXT CHECK (product_gender IN ('unisex', 'chica', 'chico'));

-- PASO 5: Agregar columnas faltantes a order_items también
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('unisex', 'chica', 'chico'));

-- PASO 6: Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_qr_designs_qr_code ON public.qr_designs(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_designs_product_size ON public.qr_designs(product_size);
CREATE INDEX IF NOT EXISTS idx_qr_designs_product_color ON public.qr_designs(product_color);
CREATE INDEX IF NOT EXISTS idx_qr_designs_product_gender ON public.qr_designs(product_gender);
CREATE INDEX IF NOT EXISTS idx_order_items_gender ON public.order_items(gender);

-- PASO 7: Verificar que todo esté correcto
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'qr_designs' 
ORDER BY ordinal_position;
