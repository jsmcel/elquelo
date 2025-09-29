# Instrucciones para Actualizar la Base de Datos

## Problema
El error indica que las columnas `product_color`, `product_size`, y `product_gender` no existen en la tabla `qr_designs`.

## Solución
Ejecuta este SQL en el Supabase SQL Editor:

```sql
-- Add missing columns to qr_designs table
ALTER TABLE public.qr_designs 
ADD COLUMN IF NOT EXISTS product_size TEXT,
ADD COLUMN IF NOT EXISTS product_color TEXT,
ADD COLUMN IF NOT EXISTS product_gender TEXT CHECK (product_gender IN ('unisex', 'chica', 'chico'));

-- Add missing column to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('unisex', 'chica', 'chico'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_qr_designs_qr_code ON public.qr_designs(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_designs_product_size ON public.qr_designs(product_size);
CREATE INDEX IF NOT EXISTS idx_qr_designs_product_color ON public.qr_designs(product_color);
CREATE INDEX IF NOT EXISTS idx_qr_designs_product_gender ON public.qr_designs(product_gender);
```

## Pasos:
1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Pega el SQL de arriba
4. Ejecuta el comando
5. Verifica que las columnas se hayan creado correctamente

## Verificación:
Después de ejecutar el SQL, puedes verificar que las columnas existen ejecutando:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'qr_designs' 
AND column_name IN ('product_size', 'product_color', 'product_gender');
```

