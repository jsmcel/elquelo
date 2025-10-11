import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('Adding event_date column to groups table...')
    
    // Try to add the column using a simple approach
    const { data, error } = await supabase
      .from('groups')
      .select('event_date')
      .limit(1)
    
    if (error && error.code === 'PGRST204') {
      // Column doesn't exist, try to add it
      console.log('Column event_date does not exist, attempting to add it...')
      
      // Use RPC to execute SQL
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS event_date DATE;'
      })
      
      if (sqlError) {
        console.error('Error adding column:', sqlError)
        return NextResponse.json({ success: false, error: sqlError.message }, { status: 500 })
      }
      
      console.log('✅ event_date column added successfully!')
    } else if (error) {
      console.error('Error checking column:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    } else {
      console.log('✅ event_date column already exists')
    }
    
    // Verify the column exists
    const { data: groups, error: verifyError } = await supabase
      .from('groups')
      .select('id, name, event_date')
      .limit(1)
    
    if (verifyError) {
      return NextResponse.json({ success: false, error: verifyError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'event_date column is ready',
      sampleGroup: groups?.[0] || null
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'Migration failed' }, { status: 500 })
  }
}

