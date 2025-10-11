import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('Checking and adding event_id column to orders table...')
    
    // Try to select event_id column specifically
    const { data, error } = await supabase
      .from('orders')
      .select('event_id')
      .limit(1)
    
    if (error) {
      console.log('Error accessing event_id column:', error.message)
      
      if (error.code === 'PGRST204') {
        console.log('Column event_id missing, adding it...')
        
        // Try to add the column using a direct SQL approach
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id);`
        })
        
        if (sqlError) {
          console.error('Error adding column:', sqlError)
          return NextResponse.json({ success: false, error: sqlError.message }, { status: 500 })
        }
        
        // Add index
        const { error: indexError } = await supabase.rpc('exec_sql', {
          sql: `CREATE INDEX IF NOT EXISTS idx_orders_event_id ON public.orders(event_id);`
        })
        
        if (indexError) {
          console.error('Error adding index:', indexError)
        }
        
        console.log('✅ event_id column and index added successfully!')
        return NextResponse.json({ success: true, message: 'Column and index added successfully' })
      }
    }
    
    console.log('✅ Column event_id exists and is accessible')
    return NextResponse.json({ success: true, message: 'Column exists', data })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'Database fix failed' }, { status: 500 })
  }
}
