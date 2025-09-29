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

