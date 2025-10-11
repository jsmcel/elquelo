import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('Fixing event_members relationships...')
    
    // Get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
    
    if (eventsError) {
      return NextResponse.json({ success: false, error: eventsError.message }, { status: 500 })
    }
    
    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events found' })
    }
    
    // Get the group_id from the first event
    const groupId = events[0].group_id
    if (!groupId) {
      return NextResponse.json({ success: false, error: 'No group_id found' }, { status: 500 })
    }
    
    // Get the user_id from QRs in this group
    const { data: qrs, error: qrsError } = await supabase
      .from('qrs')
      .select('user_id')
      .eq('group_id', groupId)
      .limit(1)
    
    if (qrsError || !qrs || qrs.length === 0) {
      return NextResponse.json({ success: false, error: 'No QRs found for group' }, { status: 500 })
    }
    
    const userId = qrs[0].user_id
    
    // Create event_members for each event
    const memberInserts = events.map(event => ({
      event_id: event.id,
      user_id: userId,
      role: 'owner',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    const { error: insertError } = await supabase
      .from('event_members')
      .insert(memberInserts)
    
    if (insertError) {
      console.error('Error creating event members:', insertError)
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }
    
    console.log(`✅ Created ${memberInserts.length} event member relationships`)
    return NextResponse.json({ 
      success: true, 
      message: `Created ${memberInserts.length} event member relationships`,
      data: { events: events.length, userId, groupId }
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'Fix failed' }, { status: 500 })
  }
}

