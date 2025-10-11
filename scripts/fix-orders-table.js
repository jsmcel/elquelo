const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixOrdersTable() {
  try {
    console.log('Adding event_id column to orders table...')
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id);'
    })
    
    if (error) {
      console.error('Error adding event_id column:', error)
      return
    }
    
    console.log('✅ event_id column added successfully!')
    
    // Also add the index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_orders_event_id ON public.orders(event_id);'
    })
    
    if (indexError) {
      console.error('Error adding index:', indexError)
    } else {
      console.log('✅ Index created successfully!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixOrdersTable()
