import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    console.log('Adding event_date column to groups table...')
    
    // Add event_date column to groups table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS event_date DATE;'
    })
    
    if (alterError) {
      console.error('Error adding event_date column:', alterError)
      return NextResponse.json({ success: false, error: alterError.message }, { status: 500 })
    }
    
    console.log('✅ event_date column added to groups table!')
    
    // Verify the column was added
    const { data: groups, error: verifyError } = await supabase
      .from('groups')
      .select('*')
      .limit(1)
    
    if (verifyError) {
      return NextResponse.json({ success: false, error: verifyError.message }, { status: 500 })
    }
    
    const hasEventDate = groups && groups.length > 0 && 'event_date' in groups[0]
    
    return NextResponse.json({ 
      success: true, 
      message: 'event_date column added successfully',
      hasEventDate,
      sampleGroup: groups?.[0] || null
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'Add column failed' }, { status: 500 })
  }
}

