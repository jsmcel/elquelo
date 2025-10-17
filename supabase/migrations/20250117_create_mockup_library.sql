-- Create mockup_library table for caching mockups
CREATE TABLE mockup_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id INTEGER NOT NULL,
  variant_id INTEGER NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  mockup_urls JSONB NOT NULL,
  template_qr_url TEXT NOT NULL,
  product_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, variant_id, color)
);

-- Create index for fast lookups
CREATE INDEX idx_mockup_library_lookup ON mockup_library(product_id, variant_id, color);

-- Add RLS policies
ALTER TABLE mockup_library ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read mockups
CREATE POLICY "Allow authenticated users to read mockups" ON mockup_library
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update mockups
CREATE POLICY "Allow authenticated users to manage mockups" ON mockup_library
  FOR ALL USING (auth.role() = 'authenticated');
