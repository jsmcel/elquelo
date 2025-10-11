import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Check events table
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
    
    // Check event_members table
    const { data: eventMembers, error: membersError } = await supabase
      .from('event_members')
      .select('*')
    
    // Check QRs with event_id
    const { data: qrs, error: qrsError } = await supabase
      .from('qrs')
      .select('*')
      .not('event_id', 'is', null)
    
    return NextResponse.json({
      events: { data: events, error: eventsError },
      event_members: { data: eventMembers, error: membersError },
      qrs_with_events: { data: qrs, error: qrsError }
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}

