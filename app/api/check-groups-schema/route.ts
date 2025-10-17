import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    // Check if groups table has event_date column
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        hasEventDate: false 
      })
    }
    
    // Check if the first group has event_date property
    const hasEventDate = groups && groups.length > 0 && 'event_date' in groups[0]
    
    return NextResponse.json({ 
      success: true, 
      hasEventDate,
      sampleGroup: groups?.[0] || null
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Schema check failed',
      hasEventDate: false 
    })
  }
}

