const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://xyz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NzM5NzQ4MDAsImV4cCI6MTk4OTU1MDgwMH0.example'
)

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
